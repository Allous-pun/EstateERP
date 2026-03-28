const app = require('./app');

const PORT = 5000;
require('./jobs/invoiceJobs');


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});