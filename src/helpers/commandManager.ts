import {REST} from "@discordjs/rest";
import {Routes} from "discord-api-types/v10";
import {Collection} from "discord.js";
import {CommandType} from "../types";

/** Maps a Guild onto a map from name to ID (global commands are in the "global" guild) */
export const CommandIDCache = new Collection<string, Collection<string, string>>();

export const RegisterCommands = async (
    commands: CommandType[],
    options: {
        guild?: string;
        apiToken: string;
        appId: string;
    }
): Promise<number> => {
    const {guild, apiToken: api_token, appId: app_id} = options;

    const rest = new REST({version: "10"}).setToken(api_token);
    const route =
        guild === undefined
            ? Routes.applicationCommands(app_id)
            : Routes.applicationGuildCommands(app_id, guild);

    const cmdArr = commands.map((command) => command.data.toJSON());
    const response = (await rest.put(route, {body: cmdArr})) as {
        id: string;
        name: string;
    }[];

    let cache = CommandIDCache.get(guild ?? "global");
    if (!cache) {
        let newCache = new Collection<string, string>();
        CommandIDCache.set(guild ?? "global", newCache);
        cache = newCache;
    }

    for (const {id, name} of response) {
        cache.set(name, id);
    }

    return response.length;
};
