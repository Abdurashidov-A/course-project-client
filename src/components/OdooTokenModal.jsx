import {
  Alert,
  Button,
  Descriptions,
  Empty,
  Input,
  Modal,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  generatePositionOdooToken,
  getPositionOdooToken,
  revokePositionOdooToken,
} from "../api/odooApi";
import { getOdooManagementErrorDetails } from "../api/odooManagementRequest";
import { useI18n } from "../i18n/i18nContext";
import {
  createInitialOdooTokenState,
  odooTokenReducer,
} from "./odooTokenState";

const { Text } = Typography;

function formatDate(value, fallback) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString();
}

export function OdooTokenModal({ open, position, onClose }) {
  const { t } = useI18n();
  const mutationLockRef = useRef(false);
  const loadSequenceRef = useRef(0);
  const confirmDialogRef = useRef(null);
  const [state, dispatch] = useReducer(
    odooTokenReducer,
    undefined,
    createInitialOdooTokenState,
  );
  const {
    token,
    rawToken,
    hasLoadedToken,
    loadError,
    pendingAction,
  } = state;
  const positionId = position?.id;
  const isRequestPending = Boolean(pendingAction);
  const isLoadingToken = pendingAction === "load";
  const mutationControlsDisabled =
    isRequestPending || !positionId || !hasLoadedToken;

  const getSafeManagementErrorMessage = useCallback(
    (error) => {
      const details = getOdooManagementErrorDetails(error);

      return t(details.key, details.fallback);
    },
    [t],
  );

  const loadToken = useCallback(
    async (requestedPositionId) => {
      if (!requestedPositionId || mutationLockRef.current) {
        return;
      }

      const requestSequence = loadSequenceRef.current + 1;
      loadSequenceRef.current = requestSequence;
      mutationLockRef.current = true;
      dispatch({ type: "REQUEST_START", actionName: "load" });

      try {
        const response = await getPositionOdooToken(requestedPositionId);

        if (loadSequenceRef.current === requestSequence) {
          dispatch({
            type: "LOAD_SUCCESS",
            token: response.token || null,
          });
        }
      } catch (error) {
        if (loadSequenceRef.current === requestSequence) {
          dispatch({
            type: "LOAD_ERROR",
            message: getSafeManagementErrorMessage(error),
          });
        }
      } finally {
        if (loadSequenceRef.current === requestSequence) {
          mutationLockRef.current = false;
        }
      }
    },
    [getSafeManagementErrorMessage],
  );

  useEffect(() => {
    if (!open || !positionId) {
      return undefined;
    }

    void loadToken(positionId);

    return () => {
      loadSequenceRef.current += 1;
      mutationLockRef.current = false;
    };
  }, [loadToken, open, positionId]);

  async function refreshToken(requestedPositionId) {
    try {
      const response = await getPositionOdooToken(requestedPositionId);
      dispatch({
        type: "LOAD_SUCCESS",
        token: response.token || null,
      });
    } catch (error) {
      dispatch({
        type: "LOAD_ERROR",
        message: getSafeManagementErrorMessage(error),
      });
    }
  }

  async function handleMutationError(
    error,
    requestedPositionId,
  ) {
    if (error.response?.status === 409) {
      message.warning(
        t(
          "odooToken.versionConflict",
          "Odoo token was changed elsewhere. Refreshing its current state.",
        ),
      );
      await refreshToken(requestedPositionId);
      return;
    }

    dispatch({ type: "REQUEST_ERROR" });
    message.error(getSafeManagementErrorMessage(error));
  }

  async function startGenerate(version, isRegeneration, onSettled) {
    if (
      !positionId ||
      !hasLoadedToken ||
      mutationLockRef.current
    ) {
      onSettled?.();
      return;
    }

    mutationLockRef.current = true;
    dispatch({ type: "REQUEST_START", actionName: "generate" });

    try {
      const response = await generatePositionOdooToken(
        positionId,
        version,
      );
      dispatch({
        type: "MUTATION_SUCCESS",
        token: response.token || null,
        rawToken:
          typeof response.rawToken === "string" ? response.rawToken : null,
      });
      message.success(
        isRegeneration
          ? t(
              "odooToken.regenerateSuccess",
              "Odoo token regenerated successfully",
            )
          : t(
              "odooToken.generateSuccess",
              "Odoo token generated successfully",
            ),
      );
    } catch (error) {
      await handleMutationError(error, positionId);
    } finally {
      mutationLockRef.current = false;
      onSettled?.();
    }
  }

  async function startRevoke(version, onSettled) {
    if (
      !positionId ||
      !hasLoadedToken ||
      mutationLockRef.current
    ) {
      onSettled?.();
      return;
    }

    mutationLockRef.current = true;
    dispatch({ type: "REQUEST_START", actionName: "revoke" });

    try {
      const response = await revokePositionOdooToken(
        positionId,
        version,
      );
      dispatch({
        type: "MUTATION_SUCCESS",
        token: response.token || null,
        rawToken: null,
      });
      message.success(
        t("odooToken.revokeSuccess", "Odoo token revoked successfully"),
      );
    } catch (error) {
      await handleMutationError(error, positionId);
    } finally {
      mutationLockRef.current = false;
      onSettled?.();
    }
  }

  function handleClose() {
    if (mutationLockRef.current || isRequestPending) {
      return;
    }

    confirmDialogRef.current?.destroy();
    confirmDialogRef.current = null;
    dispatch({ type: "CLOSE" });
    onClose();
  }

  function confirmRegeneration() {
    if (!token || mutationControlsDisabled) {
      return;
    }

    confirmDialogRef.current = Modal.confirm({
      title: t(
        "odooToken.regenerateConfirmTitle",
        "Regenerate Odoo token?",
      ),
      content: t(
        "odooToken.regenerateConfirmText",
        "The previous token will stop working immediately. The new token will be shown only once.",
      ),
      okText: t("odooToken.regenerate", "Regenerate Token"),
      cancelText: t("common.cancel", "Cancel"),
      onOk: () =>
        new Promise((resolve) => {
          startGenerate(token.version, true, () => {
            confirmDialogRef.current = null;
            resolve();
          });
        }),
      onCancel: () => {
        confirmDialogRef.current = null;
      },
    });
  }

  function confirmRevoke() {
    if (!token || mutationControlsDisabled) {
      return;
    }

    confirmDialogRef.current = Modal.confirm({
      title: t("odooToken.revokeConfirmTitle", "Revoke Odoo token?"),
      content: t(
        "odooToken.revokeConfirmText",
        "The current token will stop working. Position and CV data will not be deleted.",
      ),
      okText: t("odooToken.revoke", "Revoke Token"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel", "Cancel"),
      onOk: () =>
        new Promise((resolve) => {
          startRevoke(token.version, () => {
            confirmDialogRef.current = null;
            resolve();
          });
        }),
      onCancel: () => {
        confirmDialogRef.current = null;
      },
    });
  }

  async function copyToken() {
    if (!rawToken || !navigator.clipboard?.writeText) {
      message.error(
        t("odooToken.copyError", "Could not copy the Odoo token"),
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(rawToken);
      message.success(t("odooToken.copySuccess", "Odoo token copied"));
    } catch {
      message.error(
        t("odooToken.copyError", "Could not copy the Odoo token"),
      );
    }
  }

  const unavailableText = t("common.notAvailable", "Not available");
  const tokenItems = token
    ? [
        {
          key: "status",
          label: t("odooToken.status", "Status"),
          children: (
            <Tag color={token.status === "ACTIVE" ? "green" : "red"}>
              {token.status === "ACTIVE"
                ? t("odooToken.active", "Active")
                : t("odooToken.revoked", "Revoked")}
            </Tag>
          ),
        },
        {
          key: "hint",
          label: t("odooToken.hint", "Token hint"),
          children: <Text code>{token.hint || unavailableText}</Text>,
        },
        {
          key: "version",
          label: t("odooToken.version", "Version"),
          children: token.version,
        },
        {
          key: "createdAt",
          label: t("odooToken.createdAt", "Created"),
          children: formatDate(token.createdAt, unavailableText),
        },
        {
          key: "updatedAt",
          label: t("odooToken.updatedAt", "Updated"),
          children: formatDate(token.updatedAt, unavailableText),
        },
        ...(token.status === "REVOKED"
          ? [
              {
                key: "revokedAt",
                label: t("odooToken.revokedAt", "Revoked at"),
                children: formatDate(token.revokedAt, unavailableText),
              },
            ]
          : []),
      ]
    : [];

  return (
    <Modal
      className="responsive-modal"
      title={`${t("odooToken.title", "Odoo token management")}: ${position?.title || unavailableText}`}
      open={open}
      onCancel={handleClose}
      closable={!isRequestPending}
      maskClosable={!isRequestPending}
      keyboard={!isRequestPending}
      destroyOnHidden
      footer={
        <Button disabled={isRequestPending} onClick={handleClose}>
          {t("odooToken.close", "Close")}
        </Button>
      }
      width={600}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {loadError ? (
          <Alert
            type="error"
            showIcon
            message={loadError}
            action={
              <Button
                size="small"
                loading={isLoadingToken}
                disabled={!positionId || isRequestPending}
                onClick={() => loadToken(positionId)}
              >
                {t("common.refresh", "Refresh")}
              </Button>
            }
          />
        ) : !hasLoadedToken ? (
          <Alert
            type="info"
            showIcon
            message={t(
              "odooToken.loading",
              "Loading Odoo token",
            )}
          />
        ) : (
          <>
            {rawToken ? (
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <Alert
                  type="warning"
                  showIcon
                  message={t(
                    "odooToken.shownOnceTitle",
                    "Save this token now",
                  )}
                  description={t(
                    "odooToken.shownOnceText",
                    "This token is shown only once. After closing this window, it cannot be recovered.",
                  )}
                />
                <Input.TextArea
                  value={rawToken}
                  readOnly
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  spellCheck={false}
                />
                <Button onClick={copyToken}>
                  {t("odooToken.copy", "Copy Token")}
                </Button>
              </Space>
            ) : null}

            {!token ? (
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t(
                    "odooToken.noToken",
                    "No Odoo token has been generated for this position",
                  )}
                />
                <Text type="secondary">
                  {t(
                    "odooToken.noTokenDescription",
                    "Generate a dedicated token to let Odoo read this position's published CV statistics.",
                  )}
                </Text>
                <Button
                  type="primary"
                  loading={pendingAction === "generate"}
                  disabled={mutationControlsDisabled}
                  onClick={() => startGenerate(undefined, false)}
                >
                  {t("odooToken.generate", "Generate Token")}
                </Button>
              </Space>
            ) : (
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <Descriptions column={1} size="small" items={tokenItems} />

                {token.status === "ACTIVE" ? (
                  <Space wrap>
                    <Button
                      loading={pendingAction === "generate"}
                      disabled={mutationControlsDisabled}
                      onClick={confirmRegeneration}
                    >
                      {t("odooToken.regenerate", "Regenerate Token")}
                    </Button>
                    <Button
                      danger
                      loading={pendingAction === "revoke"}
                      disabled={mutationControlsDisabled}
                      onClick={confirmRevoke}
                    >
                      {t("odooToken.revoke", "Revoke Token")}
                    </Button>
                  </Space>
                ) : (
                  <Button
                    type="primary"
                    loading={pendingAction === "generate"}
                    disabled={mutationControlsDisabled}
                    onClick={() => startGenerate(token.version, true)}
                  >
                    {t("odooToken.generateNew", "Generate New Token")}
                  </Button>
                )}
              </Space>
            )}
          </>
        )}
      </Space>
    </Modal>
  );
}
