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
import { useI18n } from "../i18n/I18nProvider";

const { Search } = Input;
const { Text, Title } = Typography;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function buildSections(role, results = {}, t) {
  if (role === "GUEST") {
    return [
      {
        key: "positions",
        title: t("guest.publicPositions", "Public Positions"),
        items: results.positions || [],
        renderDescription: (item) =>
          item.shortDescription || t("common.noDescription", "No description"),
      },
    ];
  }

  if (role === "CANDIDATE") {
    return [
      {
        key: "positions",
        title: t("search.positions", "Positions"),
        items: results.positions || [],
        renderDescription: (item) =>
          item.shortDescription || t("common.noDescription", "No description"),
      },
      {
        key: "cvs",
        title: t("search.myCvs", "My CVs"),
        items: results.cvs || [],
        renderDescription: (item) =>
          `${t("search.status", "Status")}: ${t(`status.${item.status}`, item.status)} • ${t("search.updated", "Updated")}: ${formatDate(item.updatedAt)} • ${t("positionCvs.likes", "Likes")}: ${item.likesCount ?? 0}`,
      },
      {
        key: "projects",
        title: t("search.myProjects", "My Projects"),
        items: results.projects || [],
        renderDescription: (item) =>
          item.technologyTags?.length
            ? item.technologyTags.join(", ")
            : t("dashboard.noTechnologyTags", "No technology tags"),
      },
      {
        key: "profileValues",
        title: t("search.profileValues", "My Profile Values"),
        items: results.profileValues || [],
        renderDescription: (item) =>
          `${t(`attributeType.${item.attributeType}`, item.attributeType)} • ${item.value || t("common.none", "—")}`,
      },
    ];
  }

  return [
    {
      key: "positions",
      title: t("search.positions", "Positions"),
      items: results.positions || [],
      renderDescription: (item) =>
        item.shortDescription || t("common.noDescription", "No description"),
    },
    {
      key: "attributes",
      title: t("search.attributes", "Attributes"),
      items: results.attributes || [],
      renderDescription: (item) =>
        `${t(`attributeCategory.${item.category}`, item.category)} • ${item.description || t(`attributeType.${item.type}`, item.type)}`,
    },
    {
      key: "publishedCvs",
      title: t("search.publishedCvs", "Published CVs"),
      items: results.publishedCvs || [],
      renderDescription: (item) =>
        `${item.positionTitle} • ${item.candidateName} • ${formatDate(item.updatedAt)} • ${t("positionCvs.likes", "Likes")}: ${item.likesCount ?? 0}${item.likedByCurrentUser ? ` • ${t("positionCvs.likedByYou", "Liked by you")}` : ""}`,
    },
    {
      key: "candidates",
      title: t("search.candidates", "Candidates"),
      items: results.candidates || [],
      renderDescription: (item) => item.email || t("common.none", "—"),
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
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const sections = useMemo(
    () => buildSections(searchResult?.role, searchResult?.results, t),
    [searchResult, t],
  );

  async function handleSearch(value) {
    const trimmedValue = value.trim();

    if (trimmedValue.length < 2) {
      message.info(t("search.minChars", "Enter at least 2 characters to search."));
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
      setErrorMessage(error.response?.data?.message || t("search.error", "Failed to search"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Search
        placeholder={t("search.placeholder", "Search positions, CVs, projects...")}
        allowClear
        enterButton={t("search.button", "Search")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onSearch={handleSearch}
        loading={isLoading}
        style={{ width: 360 }}
      />

      <Modal
        title={t("search.title", "Global Search")}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={5} style={{ marginBottom: 4 }}>
              {t("search.query", "Query")}: {searchResult?.query || query.trim()}
            </Title>
            <Text type="secondary">
              {t("search.totalResults", "Total results")}: {searchResult?.totalCount || 0}
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
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={t("search.noMatches", "No matches")}
                      />
                    )}
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description={t("search.noResults", "No results found")} />
            )
          ) : null}
        </Space>
      </Modal>
    </>
  );
}
