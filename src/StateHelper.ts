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

class StateCache
{
	#key: string = ''

	constructor(key: string)
	{
		this.#key = key
	}

	GetKey(): string
	{
		return this.#key
	}
}

export class StringStateCache extends StateCache
{
	constructor(key: string)
	{
		super(key)
	}

	Set(value: string)
	{
		StateHelper.Set(this.GetKey(), value)
	}

	Get(): string
	{
		return StateHelper.Get(this.GetKey())
	}
}

export class BooleanStateCache extends StateCache
{
	constructor(key: string)
	{
		super(key)
	}

	Set(value: Boolean)
	{
		StateHelper.Set(this.GetKey(), value.toString())
	}

	Get(): Boolean
	{
		return !!StateHelper.Get(this.GetKey())
	}
}

export class NumberStateCache extends StateCache
{
	constructor(key: string)
	{
		super(key)
	}

	Set(value: number)
	{
		StateHelper.Set(this.GetKey(), value.toString())
	}

	Get(): number
	{
		return +StateHelper.Get(this.GetKey())
	}
}
