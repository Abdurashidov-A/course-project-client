import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Card,
  Col,
  Empty,
  Grid,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FormOutlined,
  GlobalOutlined,
  TagsOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { getDashboardStats } from "../api/dashboardApi";
import { useI18n } from "../i18n/I18nProvider";

const { Title, Text } = Typography;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function DashboardPageHeader({ subtitle }) {
  const { t } = useI18n();

  return (
    <div className="dashboard-page__header">
      <Title level={2} className="dashboard-page__title">
        {t("dashboard.title", "Dashboard")}
      </Title>
      <Text type="secondary" className="dashboard-page__subtitle">
        {subtitle}
      </Text>
    </div>
  );
}

function DashboardStatCard({ title, value, icon, tone }) {
  return (
    <Card className={`dashboard-stat-card dashboard-stat-card--${tone}`}>
      <div className="dashboard-stat-card__inner">
        <div className="dashboard-stat-card__icon" aria-hidden="true">
          {icon}
        </div>
        <div className="dashboard-stat-card__content">
          <Text className="dashboard-stat-card__label">{title}</Text>
          <Text className="dashboard-stat-card__value">{value}</Text>
        </div>
      </div>
    </Card>
  );
}

function DashboardSectionTitle({ icon, title }) {
  return (
    <span className="dashboard-section-title">
      <span className="dashboard-section-title__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="dashboard-section-title__text">{title}</span>
    </span>
  );
}

function TechnologyTagChip({ name, count, highlighted }) {
  return (
    <div
      className={`dashboard-tag-chip${highlighted ? " dashboard-tag-chip--highlighted" : ""}`}
    >
      <span className="dashboard-tag-chip__name">{name}</span>
      <span className="dashboard-tag-chip__count">{count}</span>
    </div>
  );
}

function PopularPositionsSection({ data }) {
  const { t } = useI18n();
  const screens = Grid.useBreakpoint();
  const tableScroll = screens.lg ? undefined : { x: "max-content" };
  const popularPositionsColumns = [
    {
      title: t("dashboard.position", "Position"),
      dataIndex: "title",
      key: "title",
      className: "dashboard-table__cell--position",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text className="dashboard-table__primary">
            {record.title || t("common.none", "—")}
          </Text>
          <Text className="dashboard-table__secondary">
            {record.shortDescription || t("common.noDescription", "No description")}
          </Text>
        </Space>
      ),
    },
    {
      title: t("dashboard.submittedCvs", "Submitted CVs"),
      dataIndex: "submittedCvsCount",
      key: "submittedCvsCount",
      className: "dashboard-table__cell--numeric",
      width: 112,
    },
    {
      title: t("dashboard.publishedCvs", "Published CVs"),
      dataIndex: "publishedCvsCount",
      key: "publishedCvsCount",
      className: "dashboard-table__cell--numeric",
      width: 112,
    },
  ];

  return (
    <Card
      className="dashboard-section-card dashboard-section-card--table"
      title={
        <DashboardSectionTitle
          icon={<BarChartOutlined />}
          title={t("dashboard.popularPositions", "Most Popular Positions")}
        />
      }
    >
      <Table
        className="dashboard-table dashboard-table--popular-positions"
        rowKey="id"
        columns={popularPositionsColumns}
        dataSource={data?.popularPositions || []}
        pagination={false}
        size="middle"
        tableLayout={screens.lg ? "fixed" : "auto"}
        scroll={tableScroll}
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
  const maxCount = technologyTags.reduce(
    (currentMax, item) => Math.max(currentMax, Number(item.count) || 0),
    0,
  );

  return (
    <Card
      className="dashboard-section-card dashboard-section-card--content"
      title={
        <DashboardSectionTitle
          icon={<TagsOutlined />}
          title={t("dashboard.technologyTagCloud", "Technology Tag Cloud")}
        />
      }
    >
      {technologyTags.length > 0 ? (
        <div className="dashboard-tag-cloud">
          {technologyTags.map((item) => (
            <TechnologyTagChip
              key={item.tag}
              name={item.tag}
              count={item.count}
              highlighted={maxCount > 0 && (Number(item.count) || 0) === maxCount}
            />
          ))}
        </div>
      ) : (
        <Empty description={t("dashboard.noTechnologyTags", "No technology tags yet")} />
      )}
    </Card>
  );
}

function CandidateDashboard({ data }) {
  const { t } = useI18n();
  const screens = Grid.useBreakpoint();
  const tableScroll = screens.lg ? undefined : { x: "max-content" };
  const stats = data?.stats || {};
  const statCards = [
    {
      key: "total-cvs",
      title: t("dashboard.totalMyCvs", "Total My CVs"),
      value: stats.totalCvs || 0,
      icon: <FileTextOutlined />,
      tone: "indigo",
    },
    {
      key: "published-cvs",
      title: t("dashboard.publishedCvs", "Published CVs"),
      value: stats.publishedCvs || 0,
      icon: <CheckCircleOutlined />,
      tone: "blue",
    },
    {
      key: "draft-cvs",
      title: t("dashboard.draftCvs", "Draft CVs"),
      value: stats.draftCvs || 0,
      icon: <FormOutlined />,
      tone: "orange",
    },
    {
      key: "projects",
      title: t("dashboard.myProjects", "My Projects"),
      value: stats.projects || 0,
      icon: <FolderOpenOutlined />,
      tone: "purple",
    },
    {
      key: "filled-profile-attributes",
      title: t("dashboard.filledProfileAttributes", "Filled Profile Attributes"),
      value: stats.filledProfileAttributes || 0,
      icon: <AuditOutlined />,
      tone: "teal",
    },
    {
      key: "missing-profile-attributes",
      title: t("dashboard.missingProfileAttributes", "Missing Profile Attributes"),
      value: stats.missingProfileAttributes || 0,
      icon: <ExclamationCircleOutlined />,
      tone: "orange",
    },
  ];

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
        <Tag
          className="dashboard-table__status-tag"
          color={status === "PUBLISHED" ? "green" : "blue"}
        >
          {t(`status.${status}`, status)}
        </Tag>
      ),
    },
    {
      title: t("dashboard.updatedAt", "Updated At"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      className: "dashboard-table__cell--date",
      render: (value) => (
        <Text className="dashboard-table__date">{formatDate(value)}</Text>
      ),
    },
    {
      title: t("dashboard.version", "Version"),
      dataIndex: "version",
      key: "version",
      className: "dashboard-table__cell--version",
      width: 88,
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
      className: "dashboard-table__cell--tags",
      render: (technologyTags) =>
        technologyTags?.length ? (
          <Space wrap className="dashboard-table__tag-list">
            {technologyTags.map((tag) => (
              <Tag key={tag} className="dashboard-table__info-tag">
                {tag}
              </Tag>
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
      className: "dashboard-table__cell--date",
      render: (value) => (
        <Text className="dashboard-table__date">{formatDate(value)}</Text>
      ),
    },
    {
      title: t("dashboard.version", "Version"),
      dataIndex: "version",
      key: "version",
      className: "dashboard-table__cell--version",
      width: 88,
    },
  ];

  return (
    <div className="dashboard-page">
      <DashboardPageHeader
        subtitle={t(
          "dashboard.candidateSubtitle",
          "Your current CV and profile overview.",
        )}
      />

      <div className="dashboard-page__section dashboard-page__section--stats">
        <Row className="dashboard-page__grid dashboard-page__grid--stats" gutter={[16, 16]}>
          {statCards.map((item) => (
            <Col xs={24} sm={12} lg={8} key={item.key}>
              <DashboardStatCard
                title={item.title}
                value={item.value}
                icon={item.icon}
                tone={item.tone}
              />
            </Col>
          ))}
        </Row>
      </div>

      <div className="dashboard-page__section">
        <Row className="dashboard-page__grid dashboard-page__grid--sections" gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card
              className="dashboard-section-card dashboard-section-card--table"
              title={
                <DashboardSectionTitle
                  icon={<FileTextOutlined />}
                  title={t("dashboard.recentCvs", "Recent CVs")}
                />
              }
            >
              <Table
                className="dashboard-table"
                rowKey="id"
                columns={recentCvsColumns}
                dataSource={data?.recentCvs || []}
                pagination={false}
                size="middle"
                scroll={tableScroll}
                locale={{
                  emptyText: <Empty description={t("dashboard.noCvs", "No CVs yet")} />,
                }}
              />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              className="dashboard-section-card dashboard-section-card--table"
              title={
                <DashboardSectionTitle
                  icon={<FolderOpenOutlined />}
                  title={t("dashboard.recentProjects", "Recent Projects")}
                />
              }
            >
              <Table
                className="dashboard-table dashboard-table--recent-projects"
                rowKey="id"
                columns={recentProjectsColumns}
                dataSource={data?.recentProjects || []}
                pagination={false}
                size="middle"
                tableLayout={screens.lg ? "fixed" : "auto"}
                scroll={tableScroll}
                locale={{
                  emptyText: <Empty description={t("dashboard.noProjects", "No projects yet")} />,
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div className="dashboard-page__section">
        <Row className="dashboard-page__grid" gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <PopularPositionsSection data={data} />
        </Col>
        <Col xs={24} xl={8}>
          <TechnologyTagCloudSection data={data} />
        </Col>
        </Row>
      </div>
    </div>
  );
}

function RecruiterDashboard({ data }) {
  const { t } = useI18n();
  const screens = Grid.useBreakpoint();
  const tableScroll = screens.lg ? undefined : { x: "max-content" };
  const stats = data?.stats || {};
  const statCards = [
    {
      key: "total-positions",
      title: t("dashboard.totalPositions", "Total Positions"),
      value: stats.positions || 0,
      icon: <AppstoreOutlined />,
      tone: "indigo",
    },
    {
      key: "total-attributes",
      title: t("dashboard.totalAttributes", "Total Reusable Attributes"),
      value: stats.attributes || 0,
      icon: <TagsOutlined />,
      tone: "teal",
    },
    {
      key: "published-cvs",
      title: t("dashboard.publishedCvs", "Published CVs"),
      value: stats.publishedCvs || 0,
      icon: <CheckCircleOutlined />,
      tone: "blue",
    },
    {
      key: "candidates-with-published-cvs",
      title: t(
        "dashboard.candidatesWithPublishedCvs",
        "Candidates With Published CVs",
      ),
      value: stats.candidatesWithPublishedCvs || 0,
      icon: <TeamOutlined />,
      tone: "purple",
    },
    {
      key: "public-positions",
      title: t("dashboard.publicPositions", "Public Positions"),
      value: stats.publicPositions || 0,
      icon: <GlobalOutlined />,
      tone: "orange",
    },
  ];

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
      className: "dashboard-table__cell--date",
      render: (value) => (
        <Text className="dashboard-table__date">{formatDate(value)}</Text>
      ),
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
        <Tag
          className="dashboard-table__status-tag"
          color={isPublic ? "green" : "orange"}
        >
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
      className: "dashboard-table__cell--date",
      render: (value) => (
        <Text className="dashboard-table__date">{formatDate(value)}</Text>
      ),
    },
    {
      title: t("dashboard.version", "Version"),
      dataIndex: "version",
      key: "version",
      className: "dashboard-table__cell--version",
      width: 88,
    },
  ];

  return (
    <div className="dashboard-page">
      <DashboardPageHeader
        subtitle={t(
          "dashboard.recruiterSubtitle",
          "Recruiter/admin overview for the current MVP.",
        )}
      />

      <div className="dashboard-page__section dashboard-page__section--stats">
        <Row className="dashboard-page__grid dashboard-page__grid--stats" gutter={[16, 16]}>
          {statCards.map((item) => (
            <Col xs={24} sm={12} lg={8} key={item.key}>
              <DashboardStatCard
                title={item.title}
                value={item.value}
                icon={item.icon}
                tone={item.tone}
              />
            </Col>
          ))}
        </Row>
      </div>

      <div className="dashboard-page__section">
        <Row className="dashboard-page__grid dashboard-page__grid--sections" gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card
              className="dashboard-section-card dashboard-section-card--table"
              title={
                <DashboardSectionTitle
                  icon={<FileDoneOutlined />}
                  title={t("dashboard.recentPublishedCvs", "Recent Published CVs")}
                />
              }
            >
              <Table
                className="dashboard-table"
                rowKey="id"
                columns={recentPublishedCvsColumns}
                dataSource={data?.recentPublishedCvs || []}
                pagination={false}
                size="middle"
                scroll={tableScroll}
                locale={{
                  emptyText: (
                    <Empty description={t("dashboard.noPublishedCvs", "No published CVs yet")} />
                  ),
                }}
              />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              className="dashboard-section-card dashboard-section-card--table"
              title={
                <DashboardSectionTitle
                  icon={<AppstoreOutlined />}
                  title={t("dashboard.recentPositions", "Recent Positions")}
                />
              }
            >
              <Table
                className="dashboard-table"
                rowKey="id"
                columns={recentPositionsColumns}
                dataSource={data?.recentPositions || []}
                pagination={false}
                size="middle"
                scroll={tableScroll}
                locale={{
                  emptyText: (
                    <Empty description={t("dashboard.noPositions", "No positions yet")} />
                  ),
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div className="dashboard-page__section">
        <Row className="dashboard-page__grid" gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <PopularPositionsSection data={data} />
        </Col>
        <Col xs={24} xl={8}>
          <TechnologyTagCloudSection data={data} />
        </Col>
        </Row>
      </div>
    </div>
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
      <div className="dashboard-page">
        <Alert
          className="dashboard-error-alert"
          type="error"
          message={t("dashboard.loadError", "Failed to load dashboard statistics")}
          description={error?.response?.data?.message}
          showIcon
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-page__header">
          <Title level={2} className="dashboard-page__title">
          {t("dashboard.title", "Dashboard")}
          </Title>
        </div>
        <div className="dashboard-page__section dashboard-page__section--stats">
          <Row className="dashboard-page__grid dashboard-page__grid--stats" gutter={[16, 16]}>
          {[1, 2, 3].map((item) => (
            <Col xs={24} sm={12} lg={8} key={item}>
              <Card className="dashboard-loading-card" loading />
            </Col>
          ))}
          </Row>
        </div>
      </div>
    );
  }

  if (data?.role === "CANDIDATE") {
    return <CandidateDashboard data={data} />;
  }

  return <RecruiterDashboard data={data} />;
}
