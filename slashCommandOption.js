"use strict";

const SlashCommandOption = class {
	#name;
	get name() {
		return this.#name;
	};
	#description;
	#required;
	static #nameRegex = /^[-_a-z0-9\u00C0-\u017F]+$/i;
	static #validateName = name => {
		if (name === undefined || name === null) {
			throw new TypeError("Option name is required.");
		}
		if (typeof name !== "string") {
			throw new TypeError("Option name must be a string.");
		}
		if (name.length < 1 || name.length > 32) {
			throw new RangeError("Option name must be between 1 and 32 characters.");
		}
		if (!SlashCommandOption.#nameRegex.test(name)) {
			throw new RangeError(`Option name "${name}" is invalid because it must only contain letters, numbers, hyphens, and underscores.`);
		}
		if (name !== name.toLowerCase()) {
			throw new RangeError(`Option name "${name}" is invalid because it must be lowercase.`);
		}
	};
	static #validateDescription = description => {
		if (description === undefined || description === null) {
			throw new TypeError("Option description is required.");
		}
		if (typeof description !== "string") {
			throw new TypeError("Option description must be a string.");
		}
		if (description.length < 1 || description.length > 100) {
			throw new RangeError("Option description must be between 1 and 100 characters.");
		}
	};
	static #validateRequired = required => {
		if (typeof required !== "boolean") {
			throw new TypeError("Option required must be a boolean.");
		}
	};
	constructor({name, description, required = false} = {}) {
		if (new.target === SlashCommandOption) {
			throw new TypeError("SlashCommandOption is an abstract class and cannot be instantiated directly.");
		}
		SlashCommandOption.#validateName(name);
		this.#name = name;
		SlashCommandOption.#validateDescription(description);
		this.#description = description;
		SlashCommandOption.#validateRequired(required);
		this.#required = required;
	};
	addToSlashCommandBuilder = slashCommandBuilder => {
		throw new Error("addToSlashCommandBuilder must be implemented in subclasses.");
	};
	_configureOptionBuilderCommonProperties = optionBuilder =>
		optionBuilder
			.setName(this.#name)
			.setDescription(this.#description)
			.setRequired(this.#required);
};

const SlashCommandUserOption = class extends SlashCommandOption {
	addToSlashCommandBuilder = slashCommandBuilder => slashCommandBuilder.addUserOption(optionBuilder =>
		this._configureOptionBuilderCommonProperties(optionBuilder)
	);
	getValue = interactionOptions => interactionOptions.getUser(this.name);
};

const SlashCommandBooleanOption = class extends SlashCommandOption {
	addToSlashCommandBuilder = slashCommandBuilder => slashCommandBuilder.addBooleanOption(optionBuilder =>
		this._configureOptionBuilderCommonProperties(optionBuilder)
	);
	getValue = interactionOptions => interactionOptions.getBoolean(this.name);
};

const SlashCommandStringOption = class extends SlashCommandOption {
	#choices;
	static #validateChoices = choices => {
		if (!Array.isArray(choices)) {
			throw new TypeError("Option choices must be an array.");
		}
		if (choices.length > 25) {
			throw new RangeError("Option choices must be less than or equal to 25.");
		}
		for (const choice of choices) {
			if (choice === null || typeof choice !== "object" || !Object.hasOwnProperty.call(choice, "name") || !Object.hasOwnProperty.call(choice, "value")) {
				throw new TypeError("Option choices must be an array of objects with 'name' and 'value' properties.");
			}
			if (typeof choice.name !== "string") {
				throw new TypeError("Option choice name must be a string.");
			}
			if (choice.name.length < 1 || choice.name.length > 100) {
				throw new RangeError("Option choice name must be between 1 and 100 characters.");
			}
			if (typeof choice.value !== "string") {
				throw new TypeError("Option choice value must be a string.");
			}
			if (choice.value.length < 1 || choice.value.length > 100) {
				throw new RangeError("Option choice value must be between 1 and 100 characters.");
			}
		}
	};
	constructor({choices = [], ...otherProperties} = {}) {
		super(otherProperties);
		SlashCommandStringOption.#validateChoices(choices);
		this.#choices = choices;
	};
	addToSlashCommandBuilder = slashCommandBuilder => slashCommandBuilder.addStringOption(optionBuilder =>
		this._configureOptionBuilderCommonProperties(optionBuilder)
		.setChoices(...this.#choices)
	);
	getValue = interactionOptions => interactionOptions.getString(this.name);
};

const SlashCommandIntegerOption = class extends SlashCommandOption {
	#minValue;
	#maxValue;
	static #validateBounds = (minValue, maxValue) => {
		if (minValue !== null && !Number.isSafeInteger(minValue)) {
			throw new TypeError("Option minValue must be an integer.");
		}
		if (maxValue !== null && !Number.isSafeInteger(maxValue)) {
			throw new TypeError("Option maxValue must be an integer.");
		}
		if (minValue !== null && maxValue !== null && minValue > maxValue) {
			throw new RangeError("Option minValue must be less than or equal to maxValue.");
		}
	};
	constructor({minValue = null, maxValue = null, ...otherProperties} = {}) {
		super(otherProperties);
		SlashCommandIntegerOption.#validateBounds(minValue, maxValue);
		this.#minValue = minValue;
		this.#maxValue = maxValue;
	};
	addToSlashCommandBuilder = slashCommandBuilder => slashCommandBuilder.addIntegerOption(optionBuilder => {
		this._configureOptionBuilderCommonProperties(optionBuilder);
		if (this.#minValue !== null) {
			optionBuilder.setMinValue(this.#minValue);
		}
		if (this.#maxValue !== null) {
			optionBuilder.setMaxValue(this.#maxValue);
		}
		return optionBuilder;
	});
	getValue = interactionOptions => interactionOptions.getInteger(this.name);
};

export {SlashCommandOption, SlashCommandStringOption, SlashCommandUserOption, SlashCommandIntegerOption, SlashCommandBooleanOption};
