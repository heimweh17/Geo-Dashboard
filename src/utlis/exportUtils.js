export const downloadCSV = (data, filename = "geo-data.csv") => {
  if (!data || data.length === 0) return;

  const headers = ["Name", "Type", "Latitude", "Longitude"];
  const csvContent = [
    headers.join(","),
    ...data.map((item) => {
      const name = item.tags.name ? `"${item.tags.name}"` : "Unnamed";
      const type = item.tags.amenity || "Unknown";
      return `${name},${type},${item.lat},${item.lon}`;
    }),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};