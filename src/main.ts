import * as core from '@actions/core'
import * as os from 'os'
import * as tmp from 'tmp'
import { Keychain, KeychainFile } from '@akiojin/keychain'
import { BooleanStateCache, StringStateCache } from './StateHelper'

const IsMacOS = os.platform() === 'darwin'

const PostProcess = new BooleanStateCache('IS_POST_PROCESS')
const TemporaryKeychain = new StringStateCache('TEMPORARY_KEYCHAIN')
const DefaultKeychainCache = new StringStateCache('DEFAULT_KEYCHAIN')

async function Run()
{
	try {
		const keychainName = core.getInput('keychain-name')
		const keychainPassword = core.getInput('keychain-password') || Math.random().toString(36)
		const keychainTimeout = +core.getInput('keychain-timeout')

		core.setSecret(keychainPassword)

		const keychainPath = keychainName === '' ? `${tmp.tmpNameSync()}.keychain-db` : Keychain.GenerateKeychainPath(keychainName)

		core.startGroup('Create new keychain')
		TemporaryKeychain.Set(keychainPath)

		core.setOutput('keychain', keychainPath)
		core.setOutput('keychain-password', keychainPassword)

		var keychain = new KeychainFile(
			await Keychain.CreateKeychain(keychainPath, keychainPassword),
			keychainPassword
		)
		await keychain.SetTimeout(keychainTimeout)
		core.endGroup()

		core.startGroup('Setup options')
		if (!!core.getBooleanInput('lock-keychain')) {
			core.info('Setting: lock-keychain')

			await keychain.Lock()
		}

		if (!!core.getBooleanInput('default-keychain')) {
			core.info('Setting: default-keychain')

			const defaultKeychain = await Keychain.GetDefaultKeychain()
			DefaultKeychainCache.Set(defaultKeychain[0] || Keychain.GetDefaultLoginKeychainPath())

			await keychain.SetDefault()
			await keychain.SetList()
		}

		if (!!core.getBooleanInput('login-keychain')) {
			core.info('Setting: login-keychain')

			await keychain.SetLogin()
		}

		if (!!core.getBooleanInput('append-keychain')) {
			core.info('Setting: append-keychain')

			const temp = await Keychain.GetListKeychain()
			temp.push(keychainPath)
			await Keychain.SetListKeychains(temp)
		}
		core.endGroup()

		core.startGroup('Show Keychains')
		for (const i of await Keychain.GetDefaultKeychain()) {
			core.info(`Default keychain: ${i}`)
		}
		for (const i of await Keychain.GetLoginKeychain()) {
			core.info(`Loging keychain: ${i}`)
		}
		for (const i of await Keychain.GetListKeychain()) {
			core.info(`List keychain: ${i}`)
		}
		core.endGroup()
	} catch (ex: any) {
		core.setFailed(ex.message)
	}
}

async function Cleanup()
{
	core.info('Cleanup')

	try {
		await Keychain.DeleteKeychain(TemporaryKeychain.Get())

		if (DefaultKeychainCache.Get() !== '') {
			await Keychain.SetDefaultKeychain(DefaultKeychainCache.Get())
			await Keychain.SetListKeychain(DefaultKeychainCache.Get())
		}
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
