export default function Code() {
  return (
    <div style={{ height: "500px" }}>
      <h2>Run Code Online</h2>
      <iframe
        src="https://onecompiler.com/embed/python?theme=dark&hideLanguageSelection=true"
        width="100%"
        height="500"
        style={{ border: "1px solid #ccc", borderRadius: "8px" }}
        title="Python Editor"
      ></iframe>
    </div>
  );
}
