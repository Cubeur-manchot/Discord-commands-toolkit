"use strict";

import Discord from "discord.js";
import Command from "./command.js";

export default class CommandDeployer {
	#discordClient;
	#commands;
	#applicationCommands;
	#logger;
	#guildIds;
	static #validateDiscordClient = discordClient => {
		if (!(discordClient instanceof Discord.Client)) {
			throw new TypeError("Discord client must be an instance of Discord.Client.");
		}
	};
	static #validateCommands = commands => {
		if (!Array.isArray(commands)) {
			throw new TypeError("Commands must be an array.");
		}
		if (commands.some(command => !(command instanceof Command))) {
			throw new TypeError("Commands must be an array of Command instances.");
		}
	};
	static #validateLogger = logger => {
		if (typeof logger !== "object" || logger === null) {
			throw new TypeError("Logger must be an object.");
		}
		for (const method of ["info", "warn", "error"]) {
			if (typeof logger[method] !== "function") {
				throw new TypeError(`Logger must have a "${method}" method.`);
			}
		}
	};
	static #validateDiscordClientApplicationId = discordClient => {
		if (typeof discordClient.application?.id !== "string") {
			throw new TypeError("Discord client must be ready (discordClient.application.id is not available).");
		}
	};
	static #validateGuildIds = guildIds => {
		if (guildIds === undefined || guildIds === null) {
			return;
		}
		if (!Array.isArray(guildIds)) {
			throw new TypeError("GuildIds must be an array.");
		}
		if (guildIds.length === 0) {
			throw new RangeError("GuildIds must have at least one element. To deploy commands globally, keep guildId null instead.");
		}
		if (guildIds.some(guildId => typeof guildId !== "string")) {
			throw new TypeError("GuildIds must be an array of strings (snowflakes).");
		}
	};
	constructor({discordClient, commands, logger, guildIds = null} = {}) {
		CommandDeployer.#validateDiscordClient(discordClient);
		this.#discordClient = discordClient;
		CommandDeployer.#validateCommands(commands);
		this.#commands = commands;
		this.#applicationCommands = this.#commands.flatMap(command => command.buildAllApplicationCommands());
		CommandDeployer.#validateLogger(logger);
		this.#logger = logger;
		CommandDeployer.#validateGuildIds(guildIds);
		this.#guildIds = guildIds;
	};
	setGlobalCommands = async () => {
		CommandDeployer.#validateDiscordClientApplicationId(this.#discordClient);
		this.#logger.info("Start updating global application commands.");
		await this.#discordClient.application.commands.set(this.#applicationCommands);
		this.#logger.info("Global application commands have been deployed successfully.");
	};
	setGuildCommands = async () => {
		CommandDeployer.#validateDiscordClientApplicationId(this.#discordClient);
		const missingGuilds = this.#guildIds.filter(guildId => !this.#discordClient.guilds.cache.has(guildId));
		if (missingGuilds.length > 0) {
			throw new Error(`Could not deploy guild application commands because some guilds cannot be found : ${missingGuilds.join(", ")}. The deployment of commands has been aborted.`);
		}
		this.#logger.info("Start updating guild application commands.");
		await Promise.all(this.#guildIds.map(async guildId => {
			await this.#discordClient.guilds.cache.get(guildId).commands.set(this.#applicationCommands);
			this.#logger.info(`Application commands have been deployed for guild "${guildId}".`);
		}));
		this.#logger.info(`Guild application commands have been deployed successfully for the ${this.#guildIds.length} guild(s).`);
	};
};
