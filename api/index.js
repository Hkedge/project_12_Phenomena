// Build an apiRouter using express Router
const dotenv = require('dotenv').config();
const express= require('express');
const apiRouter = express.Router();

// Import the database adapter functions from the db
const {

    client, 
    getOpenReports, 
    createReport,
    closeReport,
    createReportComment

} = require('../db')



/**
 * Set up a GET request for /reports
 * 
 * - it should use an async function
 * - it should await a call to getOpenReports
 * - on success, it should send back an object like { reports: theReports }
 * - on caught error, call next(error)
 */


apiRouter.get('/reports', async (req, res) => {

    const allReports = await getOpenReports();

    const reports = allReports.filter(report =>{
        if (report.isOpen){
         return true;
        }
        if (report.isExpired === false){
          return true;
        }
        return false;
      })
    console.log(allReports)
    res.send({
        reports
    });

});
  


/**
 * Set up a POST request for /reports
 * 
 * - it should use an async function
 * - it should await a call to createReport, passing in the fields from req.body
 * - on success, it should send back the object returned by createReport
 * - on caught error, call next(error)
 */

 apiRouter.post('/reports',  async (req, res, next) => {
    const { title, location, description, password } = req.body;
  
    const reportData = { 
      title, 
      location, 
      description,
      password
     }
     console.log("the report data is:", reportData)
    try {
      const reportToPost = await createReport(reportData);

      res.send (
        { reportToPost }
        );

    } catch (error) {
      next(new Error("Request failed with status code 500"));
    }
});


/**
 * Set up a DELETE request for /reports/:reportId
 * 
 * - it should use an async function
 * - it should await a call to closeReport, passing in the reportId from req.params
 *   and the password from req.body
 * - on success, it should send back the object returned by closeReport
 * - on caught error, call next(error)
 */

 apiRouter.delete('/reports/:reportId', async (req, res, next) => {
    const { reportId } = req.params;
    const { password } = req.body;

    try {
      const closedReport = await closeReport(reportId, password);
  
        res.send({ closedReport });
  
    } catch (error) {
      next(new Error("Request failed with status code 500"))
    }
  });

/**
 * Set up a POST request for /reports/:reportId/comments
 * 
 * - it should use an async function
 * - it should await a call to createReportComment, passing in the reportId and
 *   the fields from req.body
 * - on success, it should send back the object returned by createReportComment
 * - on caught error, call next(error)
 */

//  apiRouter.use((error, req, res, next) => {
//     res.send({
//         name: error.name, 
//         message: error.message
//     });
// });


// Export the apiRouter
module.exports = apiRouter;
