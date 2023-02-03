/** 
  // Require the Client constructor from the pg package
  // Create a constant, CONNECTION_STRING, from either process.env.DATABASE_URL or postgres://localhost:5432/phenomena-dev
  // Create the client using new Client(CONNECTION_STRING)
  // Do not connect to the client in this file!
 */
const { Client } = require('pg');
const CONNECTION_STRING = 'postgres://localhost:5432/phenomena-dev'
const client = new Client(CONNECTION_STRING)

/**
 * You should select all reports which are open. 
 *  
 * Additionally you should fetch all comments for these
 * reports, and add them to the report objects with a new field, comments.
 * 
 * Lastly, remove the password field from every report before returning them all.
 */

    // first load all of the reports which are open - done
    // then load the comments only for those reports, using a
      // WHERE "reportId" IN () clause - done
    // .isExpired if the expiration date is before now
      //you can use Date.parse(report.expirationDate) < new Date() - done 
          // then, build two new properties on each report:
    // .comments for the comments which go with it
    //    it should be an array, even if there are none
    // also, remove the password from all reports
    // finally, return the reports


async function getOpenReports() {

  try{
        const { rows: openReports } = await client.query(
      `SELECT *
      FROM reports
      WHERE "isOpen"=true;`
    ); 
    
    const reportHasIsExpiredColumn = openReports.map(report => {
        return report.isExpired
    })

    if (reportHasIsExpiredColumn[0] === undefined) {

      await client.query(
        `ALTER TABLE reports
        ADD "isExpired" BOOLEAN DEFAULT false, 
        ADD comments TEXT[];`
      )
    
      await client.query(
        `UPDATE reports
        SET "isExpired" = true
        WHERE "expirationDate" < CURRENT_TIMESTAMP`
      )
    }


    const openReportIds = openReports.map(report => {
      return report.id;
    }) 

    const { rows: comments } = await client.query(
      `SELECT *
      FROM comments
      WHERE "reportId" IN (${openReportIds})`
    );

    const testReports = comments.map(comment => {
      addCommentstoReport(comment.content, comment.reportId)
    })

    const { rows: updatedOpenReports } = await client.query(
      `SELECT *
      FROM reports
      WHERE "isOpen"=true;`
    ); 

    return updatedOpenReports;

  } catch (error) {
    throw error;
  }
}

async function addCommentstoReport(comment, reportId) {

  try{
    
    await client.query(
      `UPDATE reports
      SET comments=($1)
      WHERE id=${reportId} 
      RETURNING *;
   `,[`{${comment}}`])

  } catch (error) {
    throw error;
  }
}

/**done
 * You should use the reportFields parameter (which is
 * an object with properties: title, location, description, password)
 * to insert a new row into the reports table.
 * 
 * On success, you should return the new report object,
 * and on failure you should throw the error up the stack.
 * 
 * Make sure to remove the password from the report object
 * before returning it.
 */
  // Get all of the fields from the passed in object
  // insert the correct fields into the reports table
  // remember to return the new row from the query
  // remove the password from the returned row
  // return the new report

async function createReport(reportFields) {
 
  const {title, location, description, password} = reportFields
 
  try {

    const {rows: createdReport} = await client.query(
      `INSERT INTO reports("title", "location", "description", "password")
      VALUES($1, $2, $3, $4)
      RETURNING *;
    `, [title, location, description, password]);

    const createdReportId = createdReport.map(report => {
      return report.id;
    })
    
    const {rows: [newReport]} = await client.query(
      `SELECT id, title, location, description, "isOpen", "expirationDate"
      FROM reports
      WHERE id=${createdReportId};`
    )
    
    return newReport;

  } catch (error) {
    throw error;
  }
}

/**done
 * NOTE: This function is not for use in other files, so we use an _ to
 * remind us that it is only to be used internally.
 * (for our testing purposes, though, we WILL export it)
 * 
 * It is used in both closeReport and createReportComment, below.
 * 
 * This function should take a reportId, select the report whose 
 * id matches that report id, and return it. 
 * 
 * This should return the password since it will not eventually
 * be returned by the API, but instead used to make choices in other
 * functions.
 */
async function _getReport(reportId) {

  try {

    const { rows: [reportToEdit] } = await client.query(
    `SELECT * FROM reports 
    WHERE id=($1);`
    , [reportId]) 
    return reportToEdit;

  } catch (error) {
    throw error;
  }
}

/**done 
 * You should update the report where the reportId 
 * and password match, setting isOpen to false.
 * 
 * If the report is updated this way, return an object
 * with a message of "Success".
 * 
 * If nothing is updated this way, throw an error
 */
  // First, actually grab the report with that id
  // If it doesn't exist, throw an error with a useful message
  // If the passwords don't match, throw an error
  // If it has already been closed, throw an error with a useful message
  // Finally, update the report if there are no failures, as above
  // Return a message stating that the report has been closed

async function closeReport(reportId, password) {
  try {
    
    const reportToClose = await _getReport(reportId)

    
    if (reportToClose === undefined) {
      throw new Error ("Report does not exist with that id")
    } 
  
    
    if (reportToClose.password !== password) {
      throw new Error ("Password incorrect for this report, please try again")
    } 

    
    if (reportToClose.isOpen === false) {
      throw new Error ("This report has already been closed")
    }

    else { 

      await client.query(
        `UPDATE reports
        SET "isOpen" = false
        WHERE id=${reportId};
      `)
  
      return ({"message": "Report successfully closed!"})
    
    }
  
  } catch (error) {
    throw error;
  }
}

/**done
 * If the report is not found, or is closed or expired, throw an error
 * 
 * Otherwise, create a new comment with the correct
 * reportId, and update the expirationDate of the original
 * report to CURRENT_TIMESTAMP + interval '1 day' 
 */
 // read off the content from the commentFields
 // grab the report we are going to be commenting on 
 // if it wasn't found, throw an error saying so
 // if it is not open, throw an error saying so
 // if the current date is past the expiration, throw an error saying so
 // you can use Date.parse(report.expirationDate) < new Date() to check
 // all go: insert a comment 
 // then update the expiration date to a day from now

async function createReportComment(reportId, { content }) {

  try {

    const reportToComment = await _getReport(reportId)

    if (reportToComment === undefined) {
      throw new Error ("That report does not exist, no comment has been made")
    } 

    if (reportToComment.isOpen === false) {
      throw new Error ("That report has been closed, no comment has been made")
    }

    if (Date.parse(reportToComment.expirationDate) < new Date()){
        throw new Error ("The discussion time on this report has expired, no comment has been made")
    }
    
    else {
        const { rows: [reportComments] } = await client.query (
          `INSERT INTO comments ("reportId", "content")
          VALUES ($1, $2)
          RETURNING *;
        `, [reportId, content])
        
        await client.query(
          `UPDATE reports
          SET "expirationDate" = CURRENT_TIMESTAMP + interval '1 day'
          WHERE id=${reportId};
        `)
    
      return reportComments
      
    }

  } catch (error) {
    throw error;
  }
}

module.exports = {
  client, 
  _getReport,
  getOpenReports, 
  createReport,
  closeReport,
  createReportComment
}

