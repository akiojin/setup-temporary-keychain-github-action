import * as core from '@actions/core'
import * as os from 'os'
import * as tmp from 'tmp'
import { Keychain } from '@akiojin/keychain'
import { BooleanStateValue, StringStateValue } from './StateHelper'

const IsMacOS = os.platform() === 'darwin'

const PostProcess = new BooleanStateValue('IS_POST_PROCESS')
const KeychainCache = new StringStateValue('KEYCHAIN')

async function Run()
{
	try {
		const keychainName: string = core.getInput('keychain-name')
		const keychainPassword: string = core.getInput('keychain-password') || Math.random().toString(36)
		const keychainTimeout: number = +core.getInput('keychain-timeout')

		core.setSecret(keychainPassword)

		const keychainPath = keychainName === '' ? `${tmp.tmpNameSync()}.keychain-db` : Keychain.GenerateKeychainPath(keychainName)

		core.info('setup-temporary-keychain parameters:')
		core.info(`keychain-name=${keychainName}, keychain-password=${keychainPassword}, keychain-timeout=${keychainTimeout}`)

		core.startGroup('Create new keychain')
		{
			KeychainCache.Set(keychainPath)
			core.setOutput('keychain', keychainPath)
			core.setOutput('keychain-password', keychainPassword)

			var keychain = await Keychain.CreateKeychain(keychainPath, keychainPassword)
			await keychain.SetTimeout(keychainTimeout)
		}
		core.endGroup()

		core.startGroup('Setup options')
		{
			if (!!core.getBooleanInput('lock-keychain')) {
				await keychain.Lock()
			}
			if (!!core.getBooleanInput('default-keychain')) {
				await keychain.SetDefault()
				await keychain.SetList()
			}
			if (!!core.getBooleanInput('login-keychain')) {
				await keychain.SetLogin()
			}
			if (!!core.getBooleanInput('append-keychain')) {
				await Keychain.SetListKeychains([
					Keychain.GetDefaultLoginKeychainPath(),
					keychainPath
				])
			}
		}
		core.endGroup()

		await Keychain.ShowDefaultKeychain()
		await Keychain.ShowLoginKeychain()
		await Keychain.ShowListKeychains()
	} catch (ex: any) {
		core.setFailed(ex.message)
	}
}

async function Cleanup()
{
	core.info('Cleanup')

	try {
		await Keychain.DeleteKeychain(KeychainCache.Get())
		await Keychain.SetDefaultKeychain(Keychain.GetDefaultLoginKeychainPath())
		await Keychain.SetListKeychain(Keychain.GetDefaultLoginKeychainPath())
	} catch (ex: any) {
		core.setFailed(ex.message)
	}
}

if (!IsMacOS) {
	core.setFailed('Action requires macOS agent.')
} else {
	if (!!PostProcess.Get()) {
		Cleanup()
	} else {
		Run()
	}
	
	PostProcess.Set(true)
}
