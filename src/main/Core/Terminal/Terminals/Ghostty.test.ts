import type { AppleScriptUtility } from "@Core/AppleScriptUtility";
import { describe, expect, it, vi } from "vitest";

import { Ghostty } from "./Ghostty";

describe(Ghostty, () => {
    describe(Ghostty.prototype.terminalId, () =>
        it(`should be "Ghostty"`, () => expect(new Ghostty(<AppleScriptUtility>{}).terminalId).toBe("Ghostty")),
    );

    describe(Ghostty.prototype.launchWithCommand, () => {
        it("should execute the AppleScript to launch Ghostty with the given command", async () => {
            const appleScriptUtility = <AppleScriptUtility>{ executeAppleScript: vi.fn() };
            const ghosttyLauncher = new Ghostty(appleScriptUtility);

            await ghosttyLauncher.launchWithCommand("ls");

            expect(appleScriptUtility.executeAppleScript).toHaveBeenCalledWith(`tell application "Ghostty"
                                                            if not (exists front window) then
                                                                set targetTerminal to focused terminal of (selected tab of (new window))
                                                            else
                                                                set targetTerminal to focused terminal of (new tab in front window)
                                                            end if

                                                            activate

                                                            input text "ls" to targetTerminal
                                                            send key "enter" to targetTerminal
                                                        end tell`);
        });
    });
});
