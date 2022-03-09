import * as core from '@actions/core'
import * as os from 'os'
import * as tmp from 'tmp'
import { Security } from './Security'
import { BooleanStateValue, StringStateValue } from './StateHelper'

const IsMacOS = os.platform() === 'darwin'

const PostProcess = new BooleanStateValue('IS_POST_PROCESS')
const Keychain = new StringStateValue('KEYCHAIN')

async function Run()
{
	try {
		const keychainName: string = core.getInput('keychain-name')
		const keychainPassword: string = core.getInput('keychain-password') || Math.random().toString(36)
		const keychainTimeout: number = +core.getInput('keychain-timeout')

		core.setSecret(keychainPassword)

		let keychain = ''

		if (keychainName === '') {
			keychain = `${tmp.tmpNameSync()}.keychain-db`
		} else {
			keychain = `${process.env.HOME}/Library/Keychains/${keychainName}.keychain-db`
		}

		core.info('setup-temporary-keychain parameters:')
		core.info(`keychain-name=${keychainName}, keychain-password=${keychainPassword}, keychain-timeout=${keychainTimeout}`)

		core.startGroup('Create new keychain')
		Keychain.Set(keychain)
		core.setOutput('keychain', keychain)
		core.setOutput('keychain-password', keychainPassword)

		await Security.CreateKeychain(keychain, keychainPassword)
		await Security.SetKeychainTimeout(keychain, keychainTimeout)
		core.endGroup()

		core.startGroup('Setup options')
		if (!!core.getBooleanInput('unlock')) {
			await Security.UnlockKeychain(keychain, keychainPassword)
		}
		if (!!core.getBooleanInput('default-keychain')) {
			await Security.SetDefaultKeychain(keychain)
			await Security.SetListKeychain(keychain)
		}
		if (!!core.getBooleanInput('login-keychain')) {
			await Security.SetLoginKeychain(keychain)
		}
		if (!!core.getBooleanInput('append-keychain')) {
			await Security.SetListKeychains([
				`${process.env.HOME}/Library/Keychains/login.keychain-db`,
				keychain
			])
		}
		core.endGroup()

		await Security.ShowDefaultKeychain()
		await Security.ShowLoginKeychain()
		await Security.ShowListKeychains()
	} catch (ex: any) {
		core.setFailed(ex.message)
	}
}

async function Cleanup()
{
	core.info('Cleanup')

	try {
		await Security.DeleteKeychain(Keychain.Get())
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
