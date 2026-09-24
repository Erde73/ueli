import type { AppleScriptUtility } from "@Core/AppleScriptUtility";

import type { Terminal } from "../Contract";

export class Ghostty implements Terminal {
    public readonly terminalId = "Ghostty";

    public constructor(private readonly appleScriptUtility: AppleScriptUtility) {}

    public getTerminalName(): string {
        return "Ghostty";
    }

    public getAssetFileName(): string {
        return "ghostty.png";
    }

    public async launchWithCommand(command: string): Promise<void> {
        await this.appleScriptUtility.executeAppleScript(`tell application "Ghostty"
                                                            if not (exists front window) then
                                                                set targetTerminal to focused terminal of (selected tab of (new window))
                                                            else
                                                                set targetTerminal to focused terminal of (new tab in front window)
                                                            end if

                                                            activate

                                                            input text "${command}" to targetTerminal
                                                            send key "enter" to targetTerminal
                                                        end tell`);
    }
}
