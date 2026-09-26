import { useExtensionSetting } from "@Core/Hooks";
import { Setting } from "@Core/Settings/Setting";
import { SettingGroup } from "@Core/Settings/SettingGroup";
import { SettingGroupList } from "@Core/Settings/SettingGroupList";
import { Input, SpinButton } from "@fluentui/react-components";
import { useTranslation } from "react-i18next";

import { SnippetsSettings } from "./SnippetsSettings";

export const ClipboardManagerSettings = () => {
    const extensionId = "ClipboardManager";

    const { t } = useTranslation("extension[ClipboardManager]");

    const { value: prefix, updateValue: setPrefix } = useExtensionSetting<string>({ extensionId, key: "prefix" });

    const { value: snippetPrefix, updateValue: setSnippetPrefix } = useExtensionSetting<string>({
        extensionId,
        key: "snippetPrefix",
    });

    const { value: maxHistorySize, updateValue: setMaxHistorySize } = useExtensionSetting<number>({
        extensionId,
        key: "maxHistorySize",
    });

    const { value: autoPasteDelayMs, updateValue: setAutoPasteDelayMs } = useExtensionSetting<number>({
        extensionId,
        key: "autoPasteDelayMs",
    });

    return (
        <SettingGroupList>
            <SettingGroup title={t("extensionName")}>
                <Setting
                    label={t("prefixLabel")}
                    description={t("prefixDescription")}
                    control={<Input value={prefix} onChange={(_, { value }) => setPrefix(value)} />}
                />
                <Setting
                    label={t("snippetPrefixLabel")}
                    description={t("snippetPrefixDescription")}
                    control={<Input value={snippetPrefix} onChange={(_, { value }) => setSnippetPrefix(value)} />}
                />
                <Setting
                    label={t("maxHistorySizeLabel")}
                    description={t("maxHistorySizeDescription")}
                    control={
                        <SpinButton
                            value={maxHistorySize}
                            onChange={(_, { value }) => value && setMaxHistorySize(value)}
                            min={10}
                            max={5000}
                            step={10}
                        />
                    }
                />
                <Setting
                    label={t("autoPasteDelayMsLabel")}
                    description={t("autoPasteDelayMsDescription")}
                    control={
                        <SpinButton
                            value={autoPasteDelayMs}
                            onChange={(_, { value }) => value && setAutoPasteDelayMs(value)}
                            min={0}
                            max={2000}
                            step={50}
                        />
                    }
                />
            </SettingGroup>
            <SnippetsSettings />
        </SettingGroupList>
    );
};
