import {
    Button,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
    Field,
    Input,
    Textarea,
} from "@fluentui/react-components";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export type SnippetFormValue = {
    id?: number;
    name: string;
    content: string;
};

type SnippetDialogProps = {
    onSave: (value: SnippetFormValue) => void;
    initialValue: SnippetFormValue;
    isAddDialog: boolean;
    isDialogOpen: boolean;
    closeDialog: () => void;
};

const validateSnippetFormValue = (value: SnippetFormValue): Partial<Record<keyof SnippetFormValue, string>> => {
    const validation: Partial<Record<keyof SnippetFormValue, string>> = {};

    if (!value.name.trim()) {
        validation.name = "snippetNameRequiredError";
    }

    if (!value.content.trim()) {
        validation.content = "snippetContentRequiredError";
    }

    return validation;
};

export const SnippetDialog = ({ initialValue, onSave, isAddDialog, isDialogOpen, closeDialog }: SnippetDialogProps) => {
    const { t } = useTranslation("extension[ClipboardManager]");

    const [temporaryValue, setTemporaryValue] = useState<SnippetFormValue>(initialValue);
    const [validation, setValidation] = useState<Partial<Record<keyof SnippetFormValue, string>>>({});

    useEffect(() => {
        setTemporaryValue(initialValue);
        setValidation({});
    }, [initialValue]);

    const setName = (name: string) => setTemporaryValue({ ...temporaryValue, name });
    const setContent = (content: string) => setTemporaryValue({ ...temporaryValue, content });

    return (
        <Dialog
            open={isDialogOpen}
            onOpenChange={(event, { open }) => {
                event.stopPropagation();

                if (!open) {
                    closeDialog();
                }
            }}
        >
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>{isAddDialog ? t("addSnippet") : t("editSnippet")}</DialogTitle>
                    <DialogContent>
                        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 10 }}>
                            <Field
                                orientation="horizontal"
                                required={true}
                                label={t("snippetNameLabel")}
                                validationMessage={validation.name ? t(validation.name) : ""}
                                validationState={"name" in validation ? "error" : undefined}
                            >
                                <Input value={temporaryValue.name} onChange={(_, { value }) => setName(value)} />
                            </Field>
                            <Field
                                orientation="horizontal"
                                required={true}
                                label={t("snippetContentLabel")}
                                validationMessage={validation.content ? t(validation.content) : ""}
                                validationState={"content" in validation ? "error" : undefined}
                            >
                                <Textarea
                                    value={temporaryValue.content}
                                    onChange={(_, { value }) => setContent(value)}
                                    resize="vertical"
                                />
                            </Field>
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <DialogTrigger disableButtonEnhancement>
                            <Button appearance="secondary" onClick={closeDialog}>
                                {t("cancel")}
                            </Button>
                        </DialogTrigger>
                        <Button
                            appearance="primary"
                            onClick={() => {
                                const validationResult = validateSnippetFormValue(temporaryValue);
                                setValidation(validationResult);

                                if (Object.keys(validationResult).length > 0) {
                                    return;
                                }

                                closeDialog();
                                onSave({ ...temporaryValue, name: temporaryValue.name.trim() });
                            }}
                        >
                            {t("save")}
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};
