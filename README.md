# Discord Commands Toolkit

Utility library to define and deploy Discord application commands with Discord.js.

# Overview

1. Create one or more `Command` instances. Optionally add typed `SlashCommandOption` for slash commands.
1. Create a `CommandsHandler` to deploy commands and handle interactions, either globally or for specific guilds.

## Example

```js
import { PermissionsBitField } from "discord.js";
import { Command, CommandContexts, SlashCommandStringOption, SlashCommandUserOption, CommandsHandler } from "discord-commands-toolkit";

// create the commands
const helpCommand = new Command({
	name: "helloworld",
	description: "Reply with Hello World",
	allowDirectMessages: true,
	handleInteraction: interaction => ({content: "Hello World !"})
});
const banCommand = new Command({
	name: "ban",
	description: "Bans a member",
	contexts: new CommandContexts({isSlashCommand: true, isUserContextMenuCommand: true}),
	options: [
		new SlashCommandUserOption({name: "member", description: "Member to ban", required: true}),
		new SlashCommandStringOption({
			name: "duration",
			description: "How much time the member must be banned (definitive ban if empty)",
			choices: [{name: "1 hour", value: "1"}, {name: "1 day", value: "24"}, {name: "1 week", value: "168"}, {name: "Definitive ban", value: "infinite"}]
		})
	],
	memberPermissions: Discord.PermissionsBitField.Flags.BanMembers,
	handleInteraction: (interaction, options) => {
		options.member.ban();
		return {content: `Banning member with id ${options.member.id}...`};
	};
});

// instanciate the commands handler
const commandsHandler = new CommandsHandler({
	discordClient: client,
	commands: [helpCommand, banCommand],
	logger: logger,
	guildIds: ["123456789012345678"]
});

```

# Constructors parameters

Parameters marked with `*` are required. Others are optional.

## Command

| Parameter             | Description                                                                                                                       | Default                 | Example                                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`*               | Name of the command.                                                                                                              | -                       | "ban"                                                                                                                                                             |
| `contexts`            | Contexts supported by the command. Must be an instance of `CommandContexts`.                                                      | Slash command only      | `new CommandContexts({isSlashCommand: true, isUserContextMenuCommand: true, isMessageContextMenuCommand: true})`                                                  |
| `description`*        | Description of the command. Relevant only for slash commands.                                                                     | -                       | "Ban a member"                                                                                                                                                    |
| `options`             | Options of the command. Relevant only for slash commands. Must be an array of instances of child classes of `SlashCommandOption`. | `[]`                    | `[new SlashCommandUserOption({name: "member", description: "Member to ban", required: true})]`                                                                    |
| `allowDirectMessages` | Allow usage in direct message with the bot.                                                                                       | `false`                 | `false`                                                                                                                                                           |
| `memberPermissions`   | Restrict command usage to members having specific permissions.                                                                    | `null` (no restriction) | `Discord.PermissionsBitField.Flags.BanMembers`                                                                                                                    |
| `handleInteraction`*  | The behavior of the command. The function receives `interaction, slashCommandOptions`.                                            | -                       | `(interaction, slashCommandOptions) => {slashCommandOptions.member.ban(); return {content: "Banning member with id " + slashCommandOptions.member.id + "..."}; }` |

## CommandContexts

A command can be supported in multiple contexts. For example, a ban command can exist as slash command with user option, and as user context menu command.

| Parameter                     | Description                                                                            | Default | Example |
| ----------------------------- | -------------------------------------------------------------------------------------- | ------- | ------- |
| `isSlashCommand`              | The command can be used in slash command version (type `/` in a text channel).         | `true`  | `true`  |
| `isUserContextMenuCommand`    | The command can be used in user context menu (right click a user, Applications).       | `false` | `true`  |
| `isMessageContextMenuCommand` | The command can be used in message context menu (right click a message, Applications). | `false` | `true`  |

## SlashCommandOption

`SlashCommandOption` is an abstract class. Child classes must be implemented instead : `SlashCommandStringOption`, `SlashCommandUserOption`, `SlashCommandIntegerOption`, `SlashCommandBooleanOption`.

| Parameter      | Description                                                                                                             | Default                      | Example                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `name`*        | Name of the option.                                                                                                     | -                            | -                                                                     |
| `description`* | Description of the option.                                                                                              | -                            | -                                                                     |
| `required`     | Option is mandatory.                                                                                                    | `false`                      | `true`                                                                |
| `choices`      | Choices of the option. Relevant only for string option. Must be an array of objects with `name` and `value` properties. | `null` (no  list of choices) | `[{name: "Blue", value: "#0808FF"}, {name: "Red", value: "#FF0808"}]` |
| `minValue`     | Minimum value for the option. Relevant only for integer option.                                                         | `null` (no constraint)       | `6`                                                                   |
| `maxValue`     | Maximum value for the option. Relevant only for integer option.                                                         | `null` (no constraint)       | `11`                                                                  |


## CommandsHandler

| Parameter        | Description                                                                    | Default                    | Example                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `discordClient`* | Discord client used to interact with the Discord API.                          | -                          | -                                                                                                                 |
| `commands`*      | Commands to be deployed. Must be an array of instances of `Command`.           | -                          | `[new Command({name: "help", description: "Displays the help message for this bot", allowDirectMessages: true})]` |
| `logger`*        | Logger responsible for writing logs.                                           | -                          | -                                                                                                                 |
| `guildIds`       | IDs of the guilds to deploy the commands to. Keep empty for global deployment. | `null` (global deployment) | `["123456789012345678"]`                                                                                          |
