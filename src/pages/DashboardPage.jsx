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

const { Title, Text } = Typography;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function CandidateDashboard({ data }) {
  const stats = data?.stats || {};

  const recentCvsColumns = [
    {
      title: "Position",
      dataIndex: ["position", "title"],
      key: "position",
      render: (value) => value || "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={status === "PUBLISHED" ? "green" : "blue"}>{status}</Tag>,
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDate,
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      width: 100,
    },
  ];

  const recentProjectsColumns = [
    {
      title: "Project",
      dataIndex: "name",
      key: "name",
      render: (value) => value || "—",
    },
    {
      title: "Technology Tags",
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
          <Text type="secondary">No tags</Text>
        ),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDate,
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      width: 100,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          Dashboard
        </Title>
        <Text type="secondary">Your current CV and profile overview.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title="Total My CVs" value={stats.totalCvs || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title="Published CVs" value={stats.publishedCvs || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title="Draft CVs" value={stats.draftCvs || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title="My Projects" value={stats.projects || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Filled Profile Attributes"
              value={stats.filledProfileAttributes || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Missing Profile Attributes"
              value={stats.missingProfileAttributes || 0}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Recent CVs">
            <Table
              rowKey="id"
              columns={recentCvsColumns}
              dataSource={data?.recentCvs || []}
              pagination={false}
              locale={{ emptyText: <Empty description="No CVs yet" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Recent Projects">
            <Table
              rowKey="id"
              columns={recentProjectsColumns}
              dataSource={data?.recentProjects || []}
              pagination={false}
              locale={{ emptyText: <Empty description="No projects yet" /> }}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

function RecruiterDashboard({ data }) {
  const stats = data?.stats || {};

  const recentPublishedCvsColumns = [
    {
      title: "Candidate",
      dataIndex: ["candidate", "name"],
      key: "candidateName",
      render: (value) => value || "—",
    },
    {
      title: "Email",
      dataIndex: ["candidate", "email"],
      key: "candidateEmail",
      render: (value) => value || "—",
    },
    {
      title: "Position",
      dataIndex: ["position", "title"],
      key: "positionTitle",
      render: (value) => value || "—",
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDate,
    },
  ];

  const recentPositionsColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (value) => value || "—",
    },
    {
      title: "Access",
      dataIndex: "isPublic",
      key: "isPublic",
      render: (isPublic) => (
        <Tag color={isPublic ? "green" : "orange"}>
          {isPublic ? "Public" : "Restricted"}
        </Tag>
      ),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDate,
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      width: 100,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          Dashboard
        </Title>
        <Text type="secondary">Recruiter/admin overview for the current MVP.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title="Total Positions" value={stats.positions || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title="Total Reusable Attributes" value={stats.attributes || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title="Published CVs" value={stats.publishedCvs || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Candidates With Published CVs"
              value={stats.candidatesWithPublishedCvs || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title="Public Positions" value={stats.publicPositions || 0} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Recent Published CVs">
            <Table
              rowKey="id"
              columns={recentPublishedCvsColumns}
              dataSource={data?.recentPublishedCvs || []}
              pagination={false}
              locale={{ emptyText: <Empty description="No published CVs yet" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Recent Positions">
            <Table
              rowKey="id"
              columns={recentPositionsColumns}
              dataSource={data?.recentPositions || []}
              pagination={false}
              locale={{ emptyText: <Empty description="No positions yet" /> }}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  if (isError) {
    return (
      <Alert
        type="error"
        message="Failed to load dashboard statistics"
        description={error?.response?.data?.message}
        showIcon
      />
    );
  }

  if (isLoading) {
    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={2} style={{ marginBottom: 0 }}>
          Dashboard
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
