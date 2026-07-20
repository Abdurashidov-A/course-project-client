import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Empty, Grid, Space, Table, Tag, Typography } from "antd";
import { getPublicPositions } from "../api/publicApi";
import { useI18n } from "../i18n/I18nProvider";

const { Title, Text } = Typography;

export function PublicPositionsPage({ onOpenLogin }) {
  const { t } = useI18n();
  const screens = Grid.useBreakpoint();
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["public-positions"],
    queryFn: getPublicPositions,
  });

  const columns = [
    {
      title: t("positions.titleColumn", "Title"),
      dataIndex: "title",
      key: "title",
    },
    {
      title: t("positions.shortDescription", "Short Description"),
      dataIndex: "shortDescription",
      key: "shortDescription",
      render: (value) => value || t("common.noShortDescription", "No short description"),
    },
    {
      title: t("positions.projectTags", "Project Tags"),
      dataIndex: "projectTags",
      key: "projectTags",
      render: (tags) =>
        tags?.length ? (
          <Space wrap className="responsive-tag-list">
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">{t("common.noTags", "No tags")}</Text>
        ),
    },
    {
      title: t("positions.maxProjects", "Max Projects"),
      dataIndex: "maxProjects",
      key: "maxProjects",
      width: 140,
    },
  ];

  if (isError) {
    return (
      <Alert
        type="error"
        message={t("positions.title", "Positions")}
        description={t("positions.loadError", "Failed to load positions")}
      />
    );
  }

  return (
    <div className="responsive-page">
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div className="responsive-page__title-group">
          <Title level={2} className="responsive-page__title" style={{ marginBottom: 8 }}>
            {t("guest.publicPositions", "Public Positions")}
          </Title>
          <Text className="responsive-page__subtitle" type="secondary">
            {t("guest.loginAsCandidateCreateCv", "Login as candidate to create a CV")}
          </Text>
        </div>

        <Space wrap className="responsive-toolbar">
          <Tag color="blue">{t("guest.browseAsGuest", "Browse as guest")}</Tag>
          <Button type="link" onClick={onOpenLogin} style={{ paddingInline: 0 }}>
            {t("guest.loginCreateCv", "Login to create a CV")}
          </Button>
        </Space>

        <Table
          className="responsive-table"
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          scroll={!screens.lg ? { x: 760 } : undefined}
          locale={{
            emptyText: <Empty description={t("dashboard.noPositions", "No positions yet")} />,
          }}
        />
      </Space>
    </div>
  );
}
