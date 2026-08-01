import {
  Alert,
  Button,
  Descriptions,
  Empty,
  Input,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generatePositionOdooToken,
  getPositionOdooToken,
  revokePositionOdooToken,
} from "../api/odooApi";
import { useI18n } from "../i18n/i18nContext";

const { Text } = Typography;

function getTokenQueryKey(positionId) {
  return ["position-odoo-token", positionId];
}

function formatDate(value, fallback) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString();
}

export function OdooTokenModal({ open, position, onClose }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const mutationLockRef = useRef(false);
  const [rawToken, setRawToken] = useState(null);
  const positionId = position?.id;
  const queryKey = getTokenQueryKey(positionId);

  const tokenQuery = useQuery({
    queryKey,
    queryFn: () => getPositionOdooToken(positionId),
    enabled: Boolean(open && positionId),
    retry: false,
  });

  async function handleMutationError(error, requestedPositionId) {
    if (error.response?.status === 409) {
      setRawToken(null);
      message.warning(
        t(
          "odooToken.versionConflict",
          "Odoo token was changed elsewhere. Refreshing its current state.",
        ),
      );
      await queryClient.invalidateQueries({
        queryKey: getTokenQueryKey(requestedPositionId),
      });
      return;
    }

    message.error(
      t("odooToken.managementError", "Failed to manage the Odoo token"),
    );
  }

  const generateMutation = useMutation({
    mutationFn: async ({ requestedPositionId, version }) => {
      const response = await generatePositionOdooToken(
        requestedPositionId,
        version,
      );
      setRawToken(
        typeof response.rawToken === "string" ? response.rawToken : null,
      );

      return {
        positionId: response.positionId,
        token: response.token,
      };
    },
    onSuccess: (safeResponse, variables) => {
      queryClient.setQueryData(
        getTokenQueryKey(safeResponse.positionId),
        safeResponse,
      );
      message.success(
        variables.isRegeneration
          ? t(
              "odooToken.regenerateSuccess",
              "Odoo token regenerated successfully",
            )
          : t(
              "odooToken.generateSuccess",
              "Odoo token generated successfully",
            ),
      );
    },
    onError: (error, variables) =>
      handleMutationError(error, variables.requestedPositionId),
  });

  const revokeMutation = useMutation({
    mutationFn: ({ requestedPositionId, version }) =>
      revokePositionOdooToken(requestedPositionId, version),
    onSuccess: (safeResponse) => {
      setRawToken(null);
      queryClient.setQueryData(
        getTokenQueryKey(safeResponse.positionId),
        safeResponse,
      );
      message.success(
        t("odooToken.revokeSuccess", "Odoo token revoked successfully"),
      );
    },
    onError: (error, variables) =>
      handleMutationError(error, variables.requestedPositionId),
  });

  const token = tokenQuery.data?.token || null;
  const isMutationPending =
    generateMutation.isPending || revokeMutation.isPending;
  const mutationControlsDisabled =
    isMutationPending || tokenQuery.isFetching || !positionId;

  function startGenerate(version, isRegeneration, onSettled) {
    if (!positionId || mutationLockRef.current) {
      onSettled?.();
      return;
    }

    mutationLockRef.current = true;
    setRawToken(null);
    generateMutation.mutate(
      {
        requestedPositionId: positionId,
        version,
        isRegeneration,
      },
      {
        onSettled: () => {
          mutationLockRef.current = false;
          onSettled?.();
        },
      },
    );
  }

  function startRevoke(version, onSettled) {
    if (!positionId || mutationLockRef.current) {
      onSettled?.();
      return;
    }

    mutationLockRef.current = true;
    setRawToken(null);
    revokeMutation.mutate(
      {
        requestedPositionId: positionId,
        version,
      },
      {
        onSettled: () => {
          mutationLockRef.current = false;
          onSettled?.();
        },
      },
    );
  }

  function handleClose() {
    if (mutationLockRef.current || isMutationPending) {
      return;
    }

    setRawToken(null);
    generateMutation.reset();
    revokeMutation.reset();
    onClose();
  }

  function confirmRegeneration() {
    if (!token || mutationControlsDisabled) {
      return;
    }

    Modal.confirm({
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
          startGenerate(token.version, true, resolve);
        }),
    });
  }

  function confirmRevoke() {
    if (!token || mutationControlsDisabled) {
      return;
    }

    Modal.confirm({
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
          startRevoke(token.version, resolve);
        }),
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
      closable={!isMutationPending}
      maskClosable={!isMutationPending}
      keyboard={!isMutationPending}
      destroyOnHidden
      footer={
        <Button disabled={isMutationPending} onClick={handleClose}>
          {t("odooToken.close", "Close")}
        </Button>
      }
      width={600}
    >
      {tokenQuery.isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
          <Spin tip={t("odooToken.loading", "Loading Odoo token")} />
        </div>
      ) : tokenQuery.isError ? (
        <Alert
          type="error"
          showIcon
          message={t("odooToken.loadError", "Failed to load the Odoo token")}
          action={
            <Button
              size="small"
              loading={tokenQuery.isFetching}
              onClick={() => tokenQuery.refetch()}
            >
              {t("common.refresh", "Refresh")}
            </Button>
          }
        />
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {rawToken ? (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
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
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
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
                loading={generateMutation.isPending}
                disabled={mutationControlsDisabled}
                onClick={() => startGenerate(undefined, false)}
              >
                {t("odooToken.generate", "Generate Token")}
              </Button>
            </Space>
          ) : (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Descriptions column={1} size="small" items={tokenItems} />

              {token.status === "ACTIVE" ? (
                <Space wrap>
                  <Button
                    loading={generateMutation.isPending}
                    disabled={mutationControlsDisabled}
                    onClick={confirmRegeneration}
                  >
                    {t("odooToken.regenerate", "Regenerate Token")}
                  </Button>
                  <Button
                    danger
                    loading={revokeMutation.isPending}
                    disabled={mutationControlsDisabled}
                    onClick={confirmRevoke}
                  >
                    {t("odooToken.revoke", "Revoke Token")}
                  </Button>
                </Space>
              ) : (
                <Button
                  type="primary"
                  loading={generateMutation.isPending}
                  disabled={mutationControlsDisabled}
                  onClick={() => startGenerate(token.version, true)}
                >
                  {t("odooToken.generateNew", "Generate New Token")}
                </Button>
              )}
            </Space>
          )}
        </Space>
      )}
    </Modal>
  );
}
