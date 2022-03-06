import * as core from '@actions/core'
import * as os from 'os'
import * as tmp from 'tmp'
import { Security } from './Security'
import { StateHelper } from './StateHelper';

const IsPost = !!StateHelper.Get('POST')
const IsMacOS = os.platform() === 'darwin'

async function Run()
{
	try {
		const name: string = core.getInput('name')
		const password: string = core.getInput('password') || Math.random().toString(36)
		const timeout: number = +core.getInput('timeout')

		core.setSecret(password)

		let keychain = ''

		if (name === '') {
			keychain = `${tmp.tmpNameSync()}.keychain-db`
		} else {
			keychain = `${process.env.HOME}/Library/Keychains/${name}.keychain-db`
		}

		StateHelper.Set('KEYCHAIN_PATH', keychain)
		core.setOutput('keychain', keychain)
		core.setOutput('keychain-password', password)

		await Security.CreateKeychain(keychain, password)
		await Security.SetKeychainTimeout(keychain, timeout)

		if (!!core.getBooleanInput('unlock')) {
			await Security.UnlockKeychain(keychain, password)
		}

		if (!!core.getBooleanInput('default-keychain')) {
			await Security.SetDefaultKeychain(keychain)
		}
		if (!!core.getBooleanInput('login-keychain')) {
			await Security.SetLoginKeychain(keychain)
		}
		if (!!core.getBooleanInput('list-keychains')) {
			await Security.SetListKeychains(keychain)
		}

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
		await Security.DeleteKeychain(StateHelper.Get('KEYCHAIN_PATH'))
	} catch (ex: any) {
		core.setFailed(ex.message)
	}
}

if (!IsMacOS) {
	core.setFailed('Action requires macOS agent.')
} else {
	if (!!IsPost) {
		Cleanup()
	} else {
		Run()
	}
	
	StateHelper.Set('POST', 'true')
}
