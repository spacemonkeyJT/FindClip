import { Firebot } from "@crowbartools/firebot-custom-scripts-types";

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
  getDefaultParameters: () => ({}),
  run: async (runRequest) => {
    const searchText = runRequest.trigger.metadata.userCommand?.args.join(' ');

    if (searchText) {
      const { twitchChat } = runRequest.modules;

      const searchExpr = new RegExp(`\\b${searchText}\\b`, 'i');
      const apiClient = runRequest.modules.twitchApi.getClient();

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

      if (clip) {
        twitchChat.sendChatMessage(clip.url);
      } else {
        const triggerUserName = runRequest.trigger.metadata.username;
        twitchChat.sendChatMessage(`No matching clip found. @${triggerUserName}`);
      }
    }
  },
};

export default script;
