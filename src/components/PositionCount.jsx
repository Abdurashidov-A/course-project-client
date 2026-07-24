import { useQuery } from "@tanstack/react-query";
import { getPositionCounts, getPositionTitle } from "../api/positionApi";

const PositionCount = () => {
  const data = useQuery({
    queryKey: ["position-counts"],
    queryFn: getPositionCounts,
  });

  const title = useQuery({
    queryKey: ["position-title"],
    queryFn: getPositionTitle,
  });

  const count = data?.data?.count ?? 0;
  const titles = title?.data?.title.map((item) => item.title).join(", ") ?? "";

  console.log("titles", titles);
  return (
    <>
      <div>Total positions: {count}</div>
      <div>Position titles: {titles}</div>
    </>
  );
};

export default PositionCount;
