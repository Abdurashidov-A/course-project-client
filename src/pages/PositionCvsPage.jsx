import { Alert, Button, Empty, Grid, Space, Table, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getPositionCvs } from "../api/cvApi";
import { useI18n } from "../i18n/I18nProvider";
import { MarkdownText } from "../components/MarkdownText";

const { Title } = Typography;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export function PositionCvsPage({ positionId, onBack, onOpenCv }) {
  const { t } = useI18n();
  const screens = Grid.useBreakpoint();
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["position-cvs", positionId],
    queryFn: () => getPositionCvs(positionId),
    enabled: Boolean(positionId),
  });

  const columns = [
    {
      title: t("positionCvs.candidateName", "Candidate Name"),
      dataIndex: ["candidate", "name"],
      key: "candidateName",
      render: (name) => name || t("common.none", "—"),
    },
    {
      title: t("positionCvs.candidateEmail", "Candidate Email"),
      dataIndex: ["candidate", "email"],
      key: "candidateEmail",
      render: (email) => email || t("common.none", "—"),
    },
    {
      title: t("positionCvs.status", "Status"),
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag>{t(`status.${status}`, status)}</Tag>,
    },
    {
      title: t("positionCvs.updatedAt", "Updated At"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDate,
    },
    {
      title: t("positionCvs.version", "Version"),
      dataIndex: "version",
      key: "version",
      width: 100,
    },
    {
      title: t("positionCvs.likes", "Likes"),
      key: "likesCount",
      width: 160,
      render: (_, record) => (
        <Space wrap size={4}>
          <span>{record.likesCount ?? 0}</span>
          {record.likedByCurrentUser ? (
            <Tag color="blue">{t("positionCvs.likedByYou", "Liked by you")}</Tag>
          ) : null}
        </Space>
      ),
    },
  ];

  if (!positionId) {
    return (
      <Space direction="vertical" size="middle">
        <Button onClick={onBack}>{t("positionCvs.back", "Back to Positions")}</Button>
        <Empty description={t("positionCvs.selectPosition", "Select a position to view published CVs")} />
      </Space>
    );
  }

  if (isError) {
    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Button onClick={onBack}>{t("positionCvs.back", "Back to Positions")}</Button>
        <Alert type="error" message={t("positionCvs.loadError", "Failed to load published CVs")} />
      </Space>
    );
  }

  return (
    <div className="responsive-page">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Button onClick={onBack} style={{ width: "fit-content" }}>
          {t("positionCvs.back", "Back to Positions")}
        </Button>

        <div className="responsive-page__title-group">
          <Title level={2} className="responsive-page__title" style={{ marginBottom: 8 }}>
            {data?.position?.title || t("positionCvs.titleFallback", "Published CVs")}
          </Title>
          <MarkdownText
            className="markdown-text--muted responsive-page__subtitle"
            emptyText={t("common.noShortDescription", "No short description")}
          >
            {data?.position?.shortDescription}
          </MarkdownText>
        </div>

        {data?.position?.projectTags?.length ? (
          <Space wrap className="responsive-tag-list">
            {data.position.projectTags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ) : null}

        <Table
          className="responsive-table"
          rowKey="id"
          columns={columns}
          dataSource={data?.cvs || []}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          scroll={!screens.lg ? { x: 860 } : undefined}
          onRow={(record) => ({
            onClick: () => onOpenCv?.(record.id),
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: <Empty description={t("positionCvs.noPublishedCvs", "No published CVs found")} />,
          }}
        />
      </Space>
    </div>
  );
}
