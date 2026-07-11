import { useState } from "react";
import { Alert, Button, Empty, Modal, Space, Table, Tag, Typography, message } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteCvs, getMyCvs } from "../api/cvApi";
import { isCandidate } from "../utils/roles";
import { useI18n } from "../i18n/I18nProvider";

const { Text, Title } = Typography;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export function MyCvsPage({ user, onOpenCv }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  if (!isCandidate(user)) {
    return <Alert type="warning" message={t("myCvs.noAccess", "You do not have access to this page")} />;
  }

  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-cvs"],
    queryFn: getMyCvs,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCvs,
    onSuccess: async (result, ids) => {
      const deletedCount = result?.deletedCount ?? ids.length;

      message.success(
        deletedCount === 1
          ? t("myCvs.deleteSuccessSingle", "CV deleted")
          : t("myCvs.deleteSuccessMultiple", "CVs deleted"),
      );

      setSelectedRowKeys([]);
      await queryClient.invalidateQueries({ queryKey: ["my-cvs"] });
    },
    onError: (error) => {
      message.error(
        error.response?.data?.message ||
          t("myCvs.deleteError", "Failed to delete CV"),
      );
    },
  });

  const columns = [
    {
      title: t("myCvs.positionTitle", "Position Title"),
      dataIndex: ["position", "title"],
      key: "positionTitle",
      render: (title) => title || t("common.none", "—"),
    },
    {
      title: t("myCvs.status", "Status"),
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag>{t(`status.${status}`, status)}</Tag>,
    },
    {
      title: t("myCvs.createdAt", "Created At"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: t("myCvs.updatedAt", "Updated At"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDate,
    },
    {
      title: t("myCvs.version", "Version"),
      dataIndex: "version",
      key: "version",
      width: 100,
    },
    {
      title: t("myCvs.likes", "Likes"),
      dataIndex: "likesCount",
      key: "likesCount",
      width: 100,
      render: (likesCount) => likesCount ?? 0,
    },
  ];

  if (isError) {
    return <Alert type="error" message={t("myCvs.loadError", "Failed to load CVs")} />;
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div>
      <Title level={2}>{t("myCvs.title", "My CVs")}</Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Text type="secondary">
          {t("common.selected", "Selected")}: {selectedRowKeys.length}
        </Text>

        <Button
          danger
          disabled={selectedRowKeys.length === 0}
          loading={deleteMutation.isPending}
          onClick={() => {
            Modal.confirm({
              title: t("myCvs.deleteConfirmTitle", "Delete selected CVs?"),
              content: t(
                "myCvs.deleteConfirmBody",
                "This action cannot be undone.",
              ),
              okText: t("common.delete", "Delete"),
              cancelText: t("common.cancel", "Cancel"),
              okButtonProps: { danger: true },
              onOk: () => deleteMutation.mutate(selectedRowKeys),
            });
          }}
        >
          {t("myCvs.deleteSelected", "Delete Selected")}
        </Button>
      </Space>

      <Table
        rowKey="id"
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        onRow={(record) => ({
          onClick: (event) => {
            if (
              event.target.closest(
                ".ant-checkbox-wrapper, .ant-checkbox, .ant-table-selection-column",
              )
            ) {
              return;
            }

            onOpenCv?.(record.id);
          },
          style: { cursor: "pointer" },
        })}
        locale={{
          emptyText: <Empty description={t("myCvs.noCvs", "No CVs created yet")} />,
        }}
      />
    </div>
  );
}
