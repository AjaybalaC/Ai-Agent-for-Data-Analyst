import React, { useState } from 'react';
import axios from 'axios';
import {
  Container, TextField, Button, Typography,
  Table, TableBody, TableCell, TableHead, TableRow, Paper
} from '@mui/material';

const Home = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const response = await axios.post('http://localhost:5000/api/collect', { query });
    const item = response.data.data; 

    const combinedResults = [];

    if (item.rawData) {
      
      if (item.rawData.tavily && item.rawData.tavily.results) {
        item.rawData.tavily.results.forEach(res => {
          combinedResults.push({
            source: 'Tavily',
            title: res.title,
            link: res.url,
            snippet: res.content
          });
        });
      }
    }

    setResults(combinedResults);
  } catch (error) {
    console.error("Error in handleSubmit:", error.message);
  }
  setLoading(false);
};


  const exportToCSV = () => {
    if (!results.length) return;

    const headers = [ "Title", "Link", "Snippet"];
    const rows = results.map(r => [
      `"${r.title.replace(/"/g, '""')}"`,
      r.link,
      `"${r.snippet ? r.snippet.replace(/"/g, '""') : ''}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="md" style={{ marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom>AI Data Collector</Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Enter your query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary">
          {loading ? 'Collecting...' : 'Collect Data'}
        </Button>
      </form>

      {results.length > 0 && (
        <>
          <Button
            onClick={exportToCSV}
            variant="outlined"
            color="secondary"
            style={{ marginTop: '20px' }}
          >
            Export as CSV
          </Button>

          <Paper style={{ marginTop: '20px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {/* <TableCell>Source</TableCell> */}
                  <TableCell>Title</TableCell>
                  <TableCell>Link</TableCell>
                  <TableCell>Snippet</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>
                      {item.link ? <a href={item.link} target="_blank" rel="noopener noreferrer">Link</a> : '-'}
                    </TableCell>
                    <TableCell>{item.snippet || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default Home;