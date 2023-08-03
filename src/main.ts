import { Firebot, RunRequest } from "@crowbartools/firebot-custom-scripts-types";

type Parameters = {
  foundMessage: string;
  notFoundMessage: string;
}

const script: Firebot.CustomScript<{}> = {
  getScriptManifest: () => {
    return {
      name: "FindClip Script",
      description: "Finds a clip by title",
      author: "spacemonkeyJT",
      version: "1.0",
      firebotVersion: "5",
    };
  },
  getDefaultParameters: () => ({
    foundMessage: {
      type: "string",
      default: "Found the following clip:",
      description: "Message for when a clip is found.",
    },
    notFoundMessage: {
      type: "string",
      default: "No matching clip found.",
      description: "Message for when no matching clip is found.",
    },
  }),
  run: async (runRequest: RunRequest<Parameters>) => {
    const searchText = runRequest.trigger.metadata.userCommand?.args.join(' ');

    if (searchText) {
      const { twitchChat } = runRequest.modules;

      const searchExpr = new RegExp(`\\b${searchText}\\b`, 'i');
      const apiClient = runRequest.modules.twitchApi.getClient();

      const { foundMessage, notFoundMessage } = runRequest.parameters;

      const clip = await (async () => {
        let after: string | undefined;

        const broadcasterId = runRequest.firebot.accounts.streamer.userId;

        while (true) {
          const result = await apiClient.clips.getClipsForBroadcaster(broadcasterId, { limit: 100, after });

          for (const clip of result.data) {
            if (searchExpr.exec(clip.title)) {
              return clip;
            }
          }

          if (!result.cursor) {
            break;
          }

          after = result.cursor;
        }
      })();

      const triggerUserName = runRequest.trigger.metadata.username;

      if (clip) {
        twitchChat.sendChatMessage(`@${triggerUserName} ${foundMessage} ${clip.url}`);
      } else if (notFoundMessage) {
        twitchChat.sendChatMessage(`@${triggerUserName} ${notFoundMessage}`);
      }
    }
  },
};

export default script;
