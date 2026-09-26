import type { InvocationArgument, Snippet } from "@common/Extensions/ClipboardManager";
import { SettingGroup } from "@Core/Settings/SettingGroup";
import {
    Button,
    DialogTrigger,
    Table,
    TableBody,
    TableCell,
    TableCellActions,
    TableHeader,
    TableHeaderCell,
    TableRow,
    Tooltip,
} from "@fluentui/react-components";
import { AddRegular, DeleteDismissRegular, EditRegular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { type SnippetFormValue, SnippetDialog } from "./SnippetDialog";

const extensionId = "ClipboardManager";

const invoke = (argument: InvocationArgument): Promise<Snippet[]> =>
    window.ContextBridge.invokeExtension<InvocationArgument, Snippet[]>(extensionId, argument);

const createEmptyFormValue = (): SnippetFormValue => ({ name: "", content: "" });

export const SnippetsSettings = () => {
    const { t } = useTranslation("extension[ClipboardManager]");

    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentFormValue, setCurrentFormValue] = useState<SnippetFormValue>(createEmptyFormValue);

    useEffect(() => {
        invoke({ type: "getAll" }).then(setSnippets);
    }, []);

    const openAddDialog = () => {
        setCurrentFormValue(createEmptyFormValue());
        setIsDialogOpen(true);
    };

    const openEditDialog = (snippet: Snippet) => {
        setCurrentFormValue({ id: snippet.id, name: snippet.name, content: snippet.content });
        setIsDialogOpen(true);
    };

    const saveSnippet = async (value: SnippetFormValue) => {
        const result =
            value.id === undefined
                ? await invoke({ type: "add", name: value.name, content: value.content })
                : await invoke({ type: "update", id: value.id, name: value.name, content: value.content });

        setSnippets(result);
    };

    const removeSnippet = async (id: number) => {
        const result = await invoke({ type: "delete", id });
        setSnippets(result);
    };

    return (
        <SettingGroup title={t("snippetsSectionTitle")}>
            <Table style={{ marginBottom: 8, tableLayout: "fixed", width: "100%" }}>
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell style={{ width: 160 }}>{t("snippetNameHeader")}</TableHeaderCell>
                        <TableHeaderCell>{t("snippetContentHeader")}</TableHeaderCell>
                        <TableHeaderCell style={{ width: 90 }} />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {snippets.map((snippet) => (
                        <TableRow key={snippet.id}>
                            <TableCell style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {snippet.name}
                            </TableCell>
                            <TableCell style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {snippet.content}
                            </TableCell>
                            <TableCell>
                                <TableCellActions>
                                    <Tooltip relationship="label" content={t("edit")}>
                                        <Button
                                            size="small"
                                            icon={<EditRegular />}
                                            onClick={() => openEditDialog(snippet)}
                                        />
                                    </Tooltip>
                                    <Tooltip relationship="label" content={t("remove")}>
                                        <Button
                                            style={{ marginLeft: 4 }}
                                            size="small"
                                            icon={<DeleteDismissRegular />}
                                            onClick={() => removeSnippet(snippet.id)}
                                        />
                                    </Tooltip>
                                </TableCellActions>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div style={{ textAlign: "left", position: "sticky", bottom: 0, zIndex: 10000 }}>
                <DialogTrigger disableButtonEnhancement>
                    <Button onClick={openAddDialog} icon={<AddRegular />}>
                        {t("addSnippet")}
                    </Button>
                </DialogTrigger>
                <SnippetDialog
                    isAddDialog={currentFormValue.id === undefined}
                    isDialogOpen={isDialogOpen}
                    closeDialog={() => setIsDialogOpen(false)}
                    onSave={saveSnippet}
                    initialValue={currentFormValue}
                />
            </div>
        </SettingGroup>
    );
};
