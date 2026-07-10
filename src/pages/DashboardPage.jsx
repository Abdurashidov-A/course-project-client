import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { getDashboardStats } from "../api/dashboardApi";
import { useI18n } from "../i18n/I18nProvider";

const { Title, Text } = Typography;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function PopularPositionsSection({ data }) {
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
      title: t("dashboard.submittedCvs", "Submitted CVs"),
      dataIndex: "submittedCvsCount",
      key: "submittedCvsCount",
      width: 160,
    },
    {
      title: t("dashboard.publishedCvs", "Published CVs"),
      dataIndex: "publishedCvsCount",
      key: "publishedCvsCount",
      width: 160,
    },
  ];

  return (
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
  );
}

function TechnologyTagCloudSection({ data }) {
  const { t } = useI18n();
  const technologyTags = data?.technologyTagCloud || [];

  return (
    <Card title={t("dashboard.technologyTagCloud", "Technology Tag Cloud")}>
      {technologyTags.length > 0 ? (
        <Space wrap size={[8, 12]}>
          {technologyTags.map((item) => (
            <Tag key={item.tag} style={{ paddingInline: 12, paddingBlock: 6 }}>
              {item.tag} {item.count}
            </Tag>
          ))}
        </Space>
      ) : (
        <Empty description={t("dashboard.noTechnologyTags", "No technology tags yet")} />
      )}
    </Card>
  );
}

function CandidateDashboard({ data }) {
  const { t } = useI18n();
  const stats = data?.stats || {};

  const recentCvsColumns = [
    {
      title: t("dashboard.position", "Position"),
      dataIndex: ["position", "title"],
      key: "position",
      render: (value) => value || t("common.none", "—"),
    },
    {
      title: t("myCvs.status", "Status"),
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "PUBLISHED" ? "green" : "blue"}>
          {t(`status.${status}`, status)}
        </Tag>
      ),
    },
    {
      title: t("dashboard.updatedAt", "Updated At"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDate,
    },
    {
      title: t("dashboard.version", "Version"),
      dataIndex: "version",
      key: "version",
      width: 100,
    },
  ];

  const recentProjectsColumns = [
    {
      title: t("dashboard.project", "Project"),
      dataIndex: "name",
      key: "name",
      render: (value) => value || t("common.none", "—"),
    },
    {
      title: t("projects.technologyTags", "Technology Tags"),
      dataIndex: "technologyTags",
      key: "technologyTags",
      render: (technologyTags) =>
        technologyTags?.length ? (
          <Space wrap>
            {technologyTags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">{t("common.noTags", "No tags")}</Text>
        ),
    },
    {
      title: t("dashboard.updatedAt", "Updated At"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDate,
    },
    {
      title: t("dashboard.version", "Version"),
      dataIndex: "version",
      key: "version",
      width: 100,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          {t("dashboard.title", "Dashboard")}
        </Title>
        <Text type="secondary">
          {t("dashboard.candidateSubtitle", "Your current CV and profile overview.")}
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title={t("dashboard.totalMyCvs", "Total My CVs")} value={stats.totalCvs || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title={t("dashboard.publishedCvs", "Published CVs")} value={stats.publishedCvs || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title={t("dashboard.draftCvs", "Draft CVs")} value={stats.draftCvs || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title={t("dashboard.myProjects", "My Projects")} value={stats.projects || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title={t("dashboard.filledProfileAttributes", "Filled Profile Attributes")}
              value={stats.filledProfileAttributes || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title={t("dashboard.missingProfileAttributes", "Missing Profile Attributes")}
              value={stats.missingProfileAttributes || 0}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title={t("dashboard.recentCvs", "Recent CVs")}>
            <Table
              rowKey="id"
              columns={recentCvsColumns}
              dataSource={data?.recentCvs || []}
              pagination={false}
              locale={{ emptyText: <Empty description={t("dashboard.noCvs", "No CVs yet")} /> }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={t("dashboard.recentProjects", "Recent Projects")}>
            <Table
              rowKey="id"
              columns={recentProjectsColumns}
              dataSource={data?.recentProjects || []}
              pagination={false}
              locale={{ emptyText: <Empty description={t("dashboard.noProjects", "No projects yet")} /> }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <PopularPositionsSection data={data} />
        </Col>
        <Col xs={24} xl={8}>
          <TechnologyTagCloudSection data={data} />
        </Col>
      </Row>
    </Space>
  );
}

function RecruiterDashboard({ data }) {
  const { t } = useI18n();
  const stats = data?.stats || {};

  const recentPublishedCvsColumns = [
    {
      title: t("dashboard.candidate", "Candidate"),
      dataIndex: ["candidate", "name"],
      key: "candidateName",
      render: (value) => value || t("common.none", "—"),
    },
    {
      title: t("dashboard.email", "Email"),
      dataIndex: ["candidate", "email"],
      key: "candidateEmail",
      render: (value) => value || t("common.none", "—"),
    },
    {
      title: t("dashboard.position", "Position"),
      dataIndex: ["position", "title"],
      key: "positionTitle",
      render: (value) => value || t("common.none", "—"),
    },
    {
      title: t("dashboard.updatedAt", "Updated At"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDate,
    },
  ];

  const recentPositionsColumns = [
    {
      title: t("dashboard.titleColumn", "Title"),
      dataIndex: "title",
      key: "title",
      render: (value) => value || t("common.none", "—"),
    },
    {
      title: t("dashboard.access", "Access"),
      dataIndex: "isPublic",
      key: "isPublic",
      render: (isPublic) => (
        <Tag color={isPublic ? "green" : "orange"}>
          {isPublic
            ? t("access.public", "Public")
            : t("access.restricted", "Restricted")}
        </Tag>
      ),
    },
    {
      title: t("dashboard.updatedAt", "Updated At"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDate,
    },
    {
      title: t("dashboard.version", "Version"),
      dataIndex: "version",
      key: "version",
      width: 100,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          {t("dashboard.title", "Dashboard")}
        </Title>
        <Text type="secondary">
          {t(
            "dashboard.recruiterSubtitle",
            "Recruiter/admin overview for the current MVP.",
          )}
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title={t("dashboard.totalPositions", "Total Positions")} value={stats.positions || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title={t("dashboard.totalAttributes", "Total Reusable Attributes")} value={stats.attributes || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title={t("dashboard.publishedCvs", "Published CVs")} value={stats.publishedCvs || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title={t("dashboard.candidatesWithPublishedCvs", "Candidates With Published CVs")}
              value={stats.candidatesWithPublishedCvs || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title={t("dashboard.publicPositions", "Public Positions")} value={stats.publicPositions || 0} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title={t("dashboard.recentPublishedCvs", "Recent Published CVs")}>
            <Table
              rowKey="id"
              columns={recentPublishedCvsColumns}
              dataSource={data?.recentPublishedCvs || []}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty description={t("dashboard.noPublishedCvs", "No published CVs yet")} />
                ),
              }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={t("dashboard.recentPositions", "Recent Positions")}>
            <Table
              rowKey="id"
              columns={recentPositionsColumns}
              dataSource={data?.recentPositions || []}
              pagination={false}
              locale={{ emptyText: <Empty description={t("dashboard.noPositions", "No positions yet")} /> }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <PopularPositionsSection data={data} />
        </Col>
        <Col xs={24} xl={8}>
          <TechnologyTagCloudSection data={data} />
        </Col>
      </Row>
    </Space>
  );
}

export function DashboardPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  if (isError) {
    return (
        <Alert
          type="error"
          message={t("dashboard.loadError", "Failed to load dashboard statistics")}
          description={error?.response?.data?.message}
          showIcon
        />
    );
  }

  if (isLoading) {
    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={2} style={{ marginBottom: 0 }}>
          {t("dashboard.title", "Dashboard")}
        </Title>
        <Row gutter={[16, 16]}>
          {[1, 2, 3].map((item) => (
            <Col xs={24} sm={12} lg={8} key={item}>
              <Card loading />
            </Col>
          ))}
        </Row>
      </Space>
    );
  }

  if (data?.role === "CANDIDATE") {
    return <CandidateDashboard data={data} />;
  }

  return <RecruiterDashboard data={data} />;
}
