import * as coreCommand from '@actions/core/lib/command'

export class StateHelper
{
	static Set(key: string, value: string): void
	{
		coreCommand.issueCommand('save-state', { name: key }, value)
	}

	static Get(key: string): string
	{
		return process.env[`STATE_${key}`] || '';
	}
}
