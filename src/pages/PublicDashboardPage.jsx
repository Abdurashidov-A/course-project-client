import { useQuery } from "@tanstack/react-query";
import { Card, Col, Empty, Row, Space, Statistic, Table, Tag, Typography, Alert } from "antd";
import { getPublicStats } from "../api/publicApi";
import { useI18n } from "../i18n/I18nProvider";

const { Title, Text } = Typography;

function PublicDashboardSections({ data }) {
  const { t } = useI18n();

  const popularPositionsColumns = [
    {
      title: t("dashboard.position", "Position"),
      dataIndex: "title",
      key: "title",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.title || t("common.none", "—")}</Text>
          <Text type="secondary">
            {record.shortDescription || t("common.noDescription", "No description")}
          </Text>
        </Space>
      ),
    },
    {
      title: t("dashboard.publishedCvs", "Published CVs"),
      dataIndex: "publishedCvsCount",
      key: "publishedCvsCount",
      width: 160,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title={t("guest.publicPositions", "Public Positions")}
              value={data?.stats?.publicPositionsCount || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title={t("dashboard.publishedCvs", "Published CVs")}
              value={data?.stats?.publishedCvsCount || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title={t("dashboard.totalAttributes", "Total Reusable Attributes")}
              value={data?.stats?.totalAttributesCount || 0}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title={t("dashboard.popularPositions", "Most Popular Positions")}>
            <Table
              rowKey="id"
              columns={popularPositionsColumns}
              dataSource={data?.popularPositions || []}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty description={t("dashboard.noPopularPositions", "No popular positions yet")} />
                ),
              }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title={t("dashboard.technologyTagCloud", "Technology Tag Cloud")}>
            {(data?.technologyTagCloud || []).length ? (
              <Space wrap size={[8, 12]}>
                {data.technologyTagCloud.map((item) => (
                  <Tag key={item.tag} style={{ paddingInline: 12, paddingBlock: 6 }}>
                    {item.tag} {item.count}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Empty description={t("dashboard.noTechnologyTags", "No technology tags yet")} />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function PublicDashboardPage() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-dashboard"],
    queryFn: getPublicStats,
  });

  if (isError) {
    return (
      <Alert
        type="error"
        message={t("guest.publicStats", "Public statistics")}
        description={t("dashboard.loadError", "Failed to load dashboard statistics")}
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          {t("guest.publicDashboard", "Public Dashboard")}
        </Title>
        <Text type="secondary">
          {t("guest.publicStats", "Public statistics")}
        </Text>
      </div>

      <div style={{ opacity: isLoading ? 0.7 : 1 }}>
        <PublicDashboardSections data={data} />
      </div>
    </Space>
  );
}
