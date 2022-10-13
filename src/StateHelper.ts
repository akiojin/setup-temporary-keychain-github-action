import * as command from '@actions/core/lib/file-command'

export class ActionStateHelper
{
	static Set(key: string, value: string): void
	{
		command.issueFileCommand(key, value)
	}

	static Get(key: string): string
	{
		return process.env[`GITHUB_${key}`] || '';
	}
}

class ActionStateCache
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

export class StringStateCache extends ActionStateCache
{
	constructor(key: string)
	{
		super(key)
	}

	Set(value: string)
	{
		ActionStateHelper.Set(this.GetKey(), value)
	}

	Get(): string
	{
		return ActionStateHelper.Get(this.GetKey())
	}
}

export class BooleanStateCache extends ActionStateCache
{
	constructor(key: string)
	{
		super(key)
	}

	Set(value: Boolean)
	{
		ActionStateHelper.Set(this.GetKey(), value.toString())
	}

	Get(): Boolean
	{
		return !!ActionStateHelper.Get(this.GetKey())
	}
}

export class NumberStateCache extends ActionStateCache
{
	constructor(key: string)
	{
		super(key)
	}

	Set(value: number)
	{
		ActionStateHelper.Set(this.GetKey(), value.toString())
	}

	Get(): number
	{
		return +ActionStateHelper.Get(this.GetKey())
	}
}
