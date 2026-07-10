import { Alert, Empty, Table, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getMyCvs } from "../api/cvApi";
import { isCandidate } from "../utils/roles";
import { useI18n } from "../i18n/I18nProvider";

const { Title } = Typography;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export function MyCvsPage({ user, onOpenCv }) {
  const { t } = useI18n();

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

  return (
    <div>
      <Title level={2}>{t("myCvs.title", "My CVs")}</Title>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        onRow={(record) => ({
          onClick: () => onOpenCv?.(record.id),
          style: { cursor: "pointer" },
        })}
        locale={{
          emptyText: <Empty description={t("myCvs.noCvs", "No CVs created yet")} />,
        }}
      />
    </div>
  );
}
