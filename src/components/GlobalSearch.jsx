import {
  Alert,
  Empty,
  Input,
  List,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { useMemo, useState } from "react";
import { searchGlobal } from "../api/searchApi";

const { Search } = Input;
const { Text, Title } = Typography;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function buildSections(role, results = {}) {
  if (role === "CANDIDATE") {
    return [
      {
        key: "positions",
        title: "Positions",
        items: results.positions || [],
        renderDescription: (item) => item.shortDescription || "No description",
      },
      {
        key: "cvs",
        title: "My CVs",
        items: results.cvs || [],
        renderDescription: (item) =>
          `Status: ${item.status} • Updated: ${formatDate(item.updatedAt)}`,
      },
      {
        key: "projects",
        title: "My Projects",
        items: results.projects || [],
        renderDescription: (item) =>
          item.technologyTags?.length
            ? item.technologyTags.join(", ")
            : "No technology tags",
      },
      {
        key: "profileValues",
        title: "My Profile Values",
        items: results.profileValues || [],
        renderDescription: (item) =>
          `${item.attributeType} • ${item.value || "—"}`,
      },
    ];
  }

  return [
    {
      key: "positions",
      title: "Positions",
      items: results.positions || [],
      renderDescription: (item) => item.shortDescription || "No description",
    },
    {
      key: "attributes",
      title: "Attributes",
      items: results.attributes || [],
      renderDescription: (item) =>
        `${item.category} • ${item.description || item.type}`,
    },
    {
      key: "publishedCvs",
      title: "Published CVs",
      items: results.publishedCvs || [],
      renderDescription: (item) =>
        `${item.positionTitle} • ${item.candidateName} • ${formatDate(item.updatedAt)}`,
    },
    {
      key: "candidates",
      title: "Candidates",
      items: results.candidates || [],
      renderDescription: (item) => item.email || "—",
    },
  ];
}

function getItemTitle(item) {
  return (
    item.title ||
    item.name ||
    item.positionTitle ||
    item.attributeName ||
    item.candidateName ||
    item.email ||
    "—"
  );
}

function getItemType(item) {
  return item.type || "result";
}

function renderProjectDescription(item) {
  return (
    <Space direction="vertical" size={4} style={{ width: "100%" }}>
      {item.description ? (
        <Text type="secondary">{item.description}</Text>
      ) : null}
      <Text type="secondary">
        Tags: {item.technologyTags?.length ? item.technologyTags.join(", ") : "No technology tags"}
      </Text>
    </Space>
  );
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const sections = useMemo(
    () => buildSections(searchResult?.role, searchResult?.results),
    [searchResult],
  );

  async function handleSearch(value) {
    const trimmedValue = value.trim();

    if (trimmedValue.length < 2) {
      message.info("Enter at least 2 characters to search.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setIsModalOpen(true);

    try {
      const response = await searchGlobal(trimmedValue);
      setSearchResult(response);
    } catch (error) {
      setSearchResult(null);
      setErrorMessage(error.response?.data?.message || "Failed to search");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Search
        placeholder="Search positions, CVs, projects..."
        allowClear
        enterButton="Search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onSearch={handleSearch}
        loading={isLoading}
        style={{ width: 360 }}
      />

      <Modal
        title="Global Search"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={5} style={{ marginBottom: 4 }}>
              Query: {searchResult?.query || query.trim()}
            </Title>
            <Text type="secondary">
              Total results: {searchResult?.totalCount || 0}
            </Text>
          </div>

          {errorMessage ? <Alert type="error" message={errorMessage} showIcon /> : null}

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <Spin />
            </div>
          ) : null}

          {!isLoading && !errorMessage ? (
            sections.some((section) => section.items.length > 0) ? (
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                {sections.map((section) => (
                  <div key={section.key}>
                    <Title level={5}>{section.title}</Title>
                    {section.items.length > 0 ? (
                      <List
                        bordered
                        dataSource={section.items}
                        renderItem={(item) => (
                          <List.Item>
                            <List.Item.Meta
                              title={
                                <Space wrap>
                                  <Text>{getItemTitle(item)}</Text>
                                  <Tag>{getItemType(item)}</Tag>
                                </Space>
                              }
                              description={
                                section.key === "projects"
                                  ? renderProjectDescription(item)
                                  : section.renderDescription(item)
                              }
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No matches" />
                    )}
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description="No results found" />
            )
          ) : null}
        </Space>
      </Modal>
    </>
  );
}
