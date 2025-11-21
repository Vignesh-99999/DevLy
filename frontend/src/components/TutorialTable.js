import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../TutorialTable.css";

export default function TutorialTable() {
  const { language } = useParams();
  const navigate = useNavigate();
  const selectedLanguage = language || "python";

  const [tutorials, setTutorials] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Key to save index in localStorage per language
  const STORAGE_KEY = `selectedTopicIndex_${selectedLanguage}`;

  const getCompilerURL = (lang) => {
    const map = { c: "c", cpp: "cpp", java: "java", python: "python", py: "python" };
    return map[lang.toLowerCase()]
      ? `https://onecompiler.com/embed/${map[lang.toLowerCase()]}?listenToEvents=true`
      : null;
  };

  const getFileName = (lang) => {
    const map = {
      c: "main.c",
      cpp: "main.cpp",
      java: "Main.java",
      python: "main.py",
      py: "main.py",
    };
    return map[lang.toLowerCase()] || "main.txt";
  };

  // Fetch tutorials
  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const res = await fetch(`/api/tutorials/${selectedLanguage}`);
        const data = await res.json();
        if (data.ok && data.tutorials.length > 0) setTutorials(data.tutorials);
        else setTutorials([]);
      } catch (err) {
        console.error("Error fetching tutorials", err);
        setTutorials([]);
      }
    };
    fetchTutorials();
  }, [selectedLanguage]);

  useEffect(() => {
    if (tutorials.length === 0) {
      setFilteredTopics([]);
      return;
    }
    setFilteredTopics(tutorials[0].topics || []);
  }, [tutorials]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const idx = parseInt(stored, 10);
      if (!isNaN(idx)) setSelectedTopicIndex(idx);
    }
  }, [filteredTopics.length, STORAGE_KEY]);

  useEffect(() => {
    if (tutorials.length === 0) return;
    const allTopics = tutorials[0].topics || [];
    const filtered = searchTerm.trim()
      ? allTopics.filter((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      : allTopics;
    setFilteredTopics(filtered);
    if (selectedTopicIndex === null || selectedTopicIndex >= filtered.length) {
      setSelectedTopicIndex(filtered.length > 0 ? 0 : null);
    }
  }, [searchTerm, tutorials]);

  useEffect(() => {
    if (selectedTopicIndex !== null) {
      localStorage.setItem(STORAGE_KEY, selectedTopicIndex.toString());
    }
  }, [selectedTopicIndex, STORAGE_KEY]);

  const selectedTopic =
    filteredTopics.length > 0 &&
    selectedTopicIndex !== null &&
    selectedTopicIndex >= 0 &&
    selectedTopicIndex < filteredTopics.length
      ? filteredTopics[selectedTopicIndex]
      : null;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(key);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const injectCodeToCompiler = (iframeId, code) => {
  const iframe = document.getElementById(iframeId);
  if (!iframe) return;

  console.log("Injecting code into iframe:", iframeId);
  console.log(code);

  const lang = selectedLanguage.toLowerCase();
  const fileName = getFileName(selectedLanguage);

  setTimeout(() => {
    try {
      const targetWindow = iframe.contentWindow;
      if (!targetWindow) {
        console.warn("Compiler iframe not ready yet:", iframeId);
        return;
      }
      // First run
      targetWindow.postMessage(
        {
          eventType: "populateCode",
          language: lang,
          files: [{ name: fileName, content: code }],
        },
        "*"
      );
      targetWindow.postMessage({ eventType: "triggerRun" }, "*");

      // Second run after small delay
      setTimeout(() => {
        targetWindow.postMessage({ eventType: "triggerRun" }, "*");
        console.log("Code injected and triggered run twice.");
      }, 500);
    } catch (err) {
      console.error("Failed to postMessage to iframe:", err);
    }
  }, 1000);
};


const handleNextTopic = () => {
    if (selectedTopicIndex === null) return;
    const nextIndex = selectedTopicIndex + 1;
    if (nextIndex < filteredTopics.length) {
      setSelectedTopicIndex(nextIndex);
    } else {
      alert("You've completed all topics!");
    }
  };

  return (
    <div className="tutorial-page">
      <aside className="sidebar">
        <h2>{selectedLanguage.toUpperCase()} Topics</h2>
        <div className="search-wrapper">
          <input
            className="topic-search"
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {!filteredTopics.length && <div className="not-found-message">No topics found.</div>}
        <ul>
          {filteredTopics.map((topic, idx) => (
            <li key={topic.slug || idx}>
              <button
                className={idx === selectedTopicIndex ? "active" : ""}
                onClick={() => setSelectedTopicIndex(idx)}
              >
                {topic.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="tutorial-main">
        <div className="top-bar">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        {!selectedTopic ? (
          <p>Select a topic to see details.</p>
        ) : (
          <div className="tutorial-container">
            <div className="topic-card">
              <div className="topic-header">{selectedTopic.title}</div>
              {selectedTopic.description && <div className="topic-body">{selectedTopic.description}</div>}
              {selectedTopic.tables?.length > 0 && (
                <div className="topic-tables">
                  {selectedTopic.tables.map((table, i) => (
                    <table key={i}>
                      <thead>
                        <tr>
                          {table.headers?.map((h, idx) => (
                            <th key={idx}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows?.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ))}
                </div>
              )}
              {selectedTopic.examples?.map((ex, i) => {
                const iframeId = `oc-editor-${selectedLanguage}-${i}`;
                const copyKey = `${selectedLanguage}-${i}`;
                const isFullProgram = /main\(|#include|print|System\.out/.test(ex.code);

                return (
                  <div key={i} className="example-block">
                   {isFullProgram ? (
  <iframe
    key={`${selectedTopicIndex}-${i}`} // <--- force React to recreate iframe
    id={`oc-editor-${selectedLanguage}-${i}`}
    src={getCompilerURL(selectedLanguage)}
    width="100%"
    height="500"
    frameBorder="0"
    title={`Compiler-${i}`}
    onLoad={() =>
      injectCodeToCompiler(`oc-editor-${selectedLanguage}-${i}`, ex.code)
    }
  />
) : (
  <div className="code-wrapper">
    <pre>{ex.code}</pre>
    <button
      className="copy-icon"
      onClick={() => copyToClipboard(ex.code, copyKey)}
      title="Copy code"
    >
      {copiedIndex === copyKey ? "Copied!" : "Copy"}
    </button>
  </div>
)}


                    {ex.output && (
                      <p>
                        <strong>Output:</strong> {ex.output}
                      </p>
                    )}
                    {ex.explanation && (
                      <p>
                        <em>{ex.explanation}</em>
                      </p>
                    )}
                  </div>
                );
              })}
              {selectedTopic.extra?.length > 0 && (
                <div className="extra-content">
                  <h4>Notes</h4>
                  <ul>
                    {selectedTopic.extra.map((extra, i) => (
                      <li key={i}>{extra}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mark as Read & Next */}
              <div className="mark-next-wrapper">
                <button
                  className="back-button"
                  onClick={handleNextTopic}
                  disabled={selectedTopicIndex === filteredTopics.length - 1}
                >
                  Mark as Read & Next Topic →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
