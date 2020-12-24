/*jshint ignore:start*/

const db = require('./database');

/**
 * Return an array with all the users in the database
 */
const getAllUsersFromDB = async () => {
    try {
        const users = await db.query('SELECT * FROM user_details');

        return users.rows;
    }
    catch (error) {
        throw error;
    }
};

const getUsersByGivenBirthday = async (dateToCompare) => {
    try {
        console.log(dateToCompare);

        const users = await db.query(`
        SELECT first_name, last_name, email, birth_date
        FROM user_details
        WHERE birth_date LIKE $1`, [dateToCompare + '%']);

        console.log(users);

        return users.rows;
    }
    catch (error) {
        throw error;
    }
}

const getUsersByEmail = async (emails) => {
    try {
        let query = `
        SELECT * FROM user_details
        WHERE
        `;

        emails.forEach(email => query += ` email = '${email}' or`);

        query = query.slice(0, query.length - 3);

        const result = await db.query(query);

        return result.rows;
    }
    catch (error) {
        throw error
    }
}

const insertUserCredentialsToDB = async (user) => {
    try {
        const result = await db.query(`INSERT INTO user_credentials VALUES($1, $2, $3)`, [user.ID, user.password, new Date(Date.now())]);
    }
    catch (error) {
        throw(error);
    }
}

/**
 * Inserts a user to the database
 */
const insertUserToDB = async (user) => {
    try {
        const results = await db.query(
            `INSERT INTO 
            user_details 
            (user_id, first_name, last_name, birth_date, type, picture, phone, email, contacts) 
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                user.ID,
                user.firstName,
                user.lastName,
                user.birthDay,
                user.type,
                null,
                user.phone,
                user.email,
                user.contactUser
            ]
        );

        return results.rowCount;
    }
    catch (error) {
        throw error;
    }
};

/**
 * Find and return a user by user_id
 */
const getUserById = async (userID) => {
    try {
        const result = await db.query(`
        SELECT * FROM user_details
        INNER JOIN
        user_credentials
        USING(user_id)
        WHERE user_id=$1`, [userID]);
        
        return result.rows[0];
    }
    catch (error) {
        throw error;
    }
};

const getUserByEmail = async (email) => {
    try {
        const result = await db.query(`
        SELECT * FROM user_details
        INNER JOIN
        user_credentials
        USING(user_id)
        WHERE email=$1`, [email]);

        return result.rows[0];
    }
    catch (error) {
        throw error;
    }
};

const getDaysSinceLastPasswordChangeInDB = async (userID) => {
    try {
        const days = await db.query(`
        SELECT DATE_PART('day', current_date - last_password_change) as "daysSinceLastPasswordChange"
        FROM user_credentials
        WHERE user_id=$1`
            , [userID]
        );

        return days.rows[0];
    }
    catch (error) {
        throw error;
    }
}

/**
 * Returns true if the user with the userId exists in the database, return false otherwise
 */
const isUserInDB = async (userId) => {
    try {
        const existingUser = await db.query(`SELECT * FROM user_details WHERE user_id=$1`, [userId]);
    
        return existingUser.rowCount !== 0;
    }
    catch (error) {
        throw error;
    }
};

/**
 * A query that's updating a specific user in database
 */
const updateUserInDB = async (user) => {
    try {
        const result = await db.query(
            'UPDATE user_details SET first_name = $1, last_name = $2, email = $3, type = $4, contacts = $5, birth_date = $6, phone = $7 WHERE user_id = $8',
            [                
                user.firstName,
                user.lastName,
                user.email,
                user.type,
                user.contactUser,
                user.birthDay,
                user.phone,
                user.ID
            ]
        );

        return result.rowCount;
    }
    catch (error) {
        throw(error);
    }
};

/**
 * A query that finds and delete a user from database by user_id,
 * and returns true if the user has been deleted successfully,
 * false otherwise
 */
const deleteUserFromDB = async (userId) => {
    try {
        // need to add 'ON DELETE CASCADE' to the user_credentials table, and make the user_id to foreign key'
        const result = await db.query(`DELETE FROM user_details WHERE user_id = $1`, [userId]);

        return result.rowCount !== 0;
    }
    catch (error) {
        throw error;
    }
}

const updateColumn = async (table, column, data, userID) => {
    try {
        const query = (`UPDATE ${table} SET ${column} = $1 WHERE user_id = ${userID}`);
        await db.query(query, [data]);
    }
    catch (error) {
        throw error;
    }
};

const getAllInfoFromTable = async (table) => {
    try {
        const result = await db.query(`SELECT * FROM ${table}`);

        return result.rows;
    }
    catch (error) {
        throw error;
    }
};

const getApplicationByID = async (applicationID) => {
    try {
        const result = await db.query(`SELECT * FROM inbox WHERE inbox_id = ${applicationID}`);

        return result.rows[0];
    }
    catch (error) {
        throw error;
    }
};

const getInboxesByCommitteeNameFromDB = async (committeeName) => {
    
    const inboxes = await db.query(`SELECT 
        inbox_id, 
        sender_id,
        committee_name,
        subject,
        inbox.content AS inbox_content,
        inbox.time AS inbox_sending_time,
        is_open,
        is_spam,
        contact_email,
        contact_phone,
        priority,
        type,
        contact_full_name,
        handler_id,
        reply.content AS reply_content,
        reply.time AS reply_time
        FROM inbox LEFT JOIN reply USING (inbox_id) WHERE committee_name = '${committeeName}'
        ORDER BY inbox_id;`);
    
    return inboxes.rows;
};

const getInboxesBySenderIDFromDB = async (senderID) => {

    const inboxes = await db.query(`
    SELECT
        inbox_id,
        sender_id,
        committee_name,
        subject,
        inbox.content AS inbox_content,
        inbox.time AS inbox_sending_time,
        is_open,
        is_spam,
        contact_email,
        contact_phone,
        priority,
        type,
        contact_full_name,
        handler_id,
        reply.content AS reply_content,
        reply.time AS reply_time
        FROM inbox LEFT JOIN reply USING (inbox_id) WHERE sender_id = ${senderID}
        ORDER BY inbox_id;
    `);

    return inboxes.rows;
};

const getReplyByInboxID = async (inboxID) => {
    const result = await db.query(`SELECT * FROM reply WHERE inbox_id = ${inboxID}`);

    return result.rows[0];
};

const createNewReply = async (reply) => {
    const result = await db.query(`INSERT INTO reply VALUES ($1, $2, $3, $4);`, [
        reply.inboxID,
        reply.handlerID,
        reply.content,
        reply.time
    ]);

    await closeInboxInDB(reply.inboxID);

    return result.rowCount;
};

const closeInboxInDB = async (inboxID) => {
    const result = await db.query(`UPDATE inbox SET is_open=false WHERE inbox_id=$1`, [inboxID]);

    return result.rowCount !== 0;
};

const markAsSpamInDB = async (inboxID) => {
    const result = await db.query(`UPDATE inbox SET is_spam = true WHERE inbox_id = ${inboxID}`);

    return result.rowCount !== 0;
};

const getAllApplicationsForUser = async (userID, isSender) => {
    try {
        let column = 'sender_id';

        if (!isSender) {
            column = 'receiver_id';
        }

        const result = await db.query(`SELECT * FROM inbox WHERE ${column} = ${userID}`);

        return result.rows;
    }
    catch (error) {
        throw error;
    }
}

const insertNewApplication = async (application) => {
    try {
        const result = await db.query(
            `INSERT INTO inbox 
            (sender_id, 
                subject, 
                content, 
                time, 
                is_open, 
                is_spam, 
                contact_email, 
                contact_phone,
                priority,
                type,
                contact_full_name,
                committee_name)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [
                application.senderID,
                application.subject,
                application.content,
                application.time,
                true,
                false,
                application.email,
                application.phone,
                application.priority,
                application.type,
                application.fullName,
                application.committeeName
            ]
        );
        
        return result.rowCount !== 0;
    }
    catch (error) {
        throw error;
    }
};

const createNewCommittee = async (committeeName, committeeDescription, chairPersonID, participantsIDs) => {

    let query = `
    INSERT INTO committee (committee_name, committee_information) VALUES ('${committeeName}', '${committeeDescription}');
    INSERT INTO committee_participants VALUES (${chairPersonID}, '${committeeName}', 'Chairperson'); 
    `;

    participantsIDs.forEach(participantID => {
        query += (`INSERT INTO committee_participants VALUES (${participantID}, '${committeeName}', 'Participant');
        `);
    });
    
    const result = await db.query(query);
    return result.rowCount !== 0;
};

const getCommitteeByName = async (committeeName) => {
    const result = await db.query('SELECT * FROM committee WHERE  committee_name=$1', [committeeName]);

    return result.rows[0];
};

/* Untested function - need to test! */
const getAllCommitteeParticipantsDB = async (committeeName) => {
    try {
        const result = await db.query(`
        SELECT ud.user_id, first_name, last_name, ud.type, picture, birth_date, phone, email, contacts,		
		c.committee_name, committee_information, contact_information,
		cp.committee_position
        FROM user_details ud LEFT JOIN committee_participants cp USING(user_id) RIGHT JOIN committee c USING(committee_name)
        WHERE committee_name = $1
        `, [committeeName]);

        return result.rows;
    }
    catch (error) {
        throw error
    }
};

const getAllCommitteeNamesAndRollsFromDB = async (userID) => {
    const result = await db.query(`
    SELECT committee_name, committee_position FROM committee_participants WHERE user_id = ${userID}`);

    return result.rows;
};

const insertNewCommitteeParticipant = async (participant) => {
    try {
        const result = await db.query(
            `INSERT INTO committee_participants VALUES ($1,$2,$3)`,
            [participant.ID, participant.committeeName, participant.role]);
        
        return result.rowCount !== 0;
    }
    catch (error) {
        throw error;
    }
};

const updateCommitteeParticipantRoleDB = async (participant) => {
    try {
        await db.query(`
        UPDATE committee_participants 
        SET
        committee_position = ${participant.role} 
        WHERE
        user_id = ${participant.ID} AND committee_name = ${participant.committeeName}`);
    }
    catch (error) {
        throw error;
    }
};

const deleteCommitteeParticipantDB = async (participant) => {
    try {
        const result = await db.query(`
        DELETE FROM committee_participants
        WHERE
        user_id = ${participant.ID} 
        AND
        committee_name = ${participant.committeeName}`);

        return result.rowCount !== 0;
    }
    catch (error) {
        throw error;
    }
};

const getAllCommitteeNamesAndDescFromDB = async () => {
    const result = await db.query('SELECT committee_name AS name, committee_information AS desc FROM committee');

    return result.rows;
};

const addRoom = async (link, userID, participants, time, title) => {
    try {
        let res = await db.query(`INSERT INTO "xpertesy" (link, host_id, participants, value_date, title)
        VALUES ($1,$2,$3::text[],$4,$5)`, [link, userID, participants, time, title]);
        return res;
    }
    catch (err) {
        throw err;
    }
};

const showFutureRooms = async (userID, hostName, title, datetime) => {
    try {
        let user = await getUserById(userID)
        my_query = `SELECT DISTINCT title, CONCAT(first_name,' ',last_name) AS host_name, participants, value_date, link FROM xpertesy as x JOIN user_details as u ON
                (u.user_id = x.host_id), unnest(participants) as participant  
                WHERE (host_id = ${user.user_id} OR  participant  LIKE '%${user.email}%')
                AND value_date >=  '${datetime}'`;
        my_query += hostName ? ` AND CONCAT(first_name,' ',last_name) = '${hostName}'` : '';
        my_query += title ? ` AND title = '${title}'` : ''
        my_query += ` ORDER BY value_date`;

        let res = await db.query(my_query);
        for (i = 0; i < res.rows.length; i++) {
            res.rows[i].link = res.rows[i].link + user.first_name;
        }
        return res.rows;
    }
    catch (err) {
        throw err;
    }
}

const showPastRooms = async (userID, hostName, title, datetime) => {
    try {
        let user = await getUserById(userID)
        my_query = `SELECT DISTINCT title, CONCAT(first_name,' ',last_name) AS host_name, participants, value_date, link FROM xpertesy as x JOIN user_details as u ON
                (u.user_id = x.host_id), unnest(participants) as participant  
                WHERE (host_id = ${user.user_id} OR  participant  LIKE '%${user.email}%')
                AND value_date <=  '${datetime}' `;
        my_query += hostName ? ` AND CONCAT(first_name,' ',last_name) = '${hostName}'` : '';
        my_query += title ? ` AND title = '${title}'` : '';
        my_query += ` ORDER BY value_date DESC`;

        let res = await db.query(my_query);
        for (i = 0; i < res.rows.length; i++) {
            res.rows[i].link = res.rows[i].link + user.first_name
        }
        return res.rows;
    }
    catch (err) {
        throw err;
    }
}

const showBetweenRooms = async (userID, hostName, title, fromDate, toDate) => {
    try {
        let user = await getUserById(userID);
        my_query = `SELECT DISTINCT title, CONCAT(first_name,' ',last_name) AS host_name, participants, value_date, link FROM xpertesy as x JOIN user_details as u ON
                (u.user_id = x.host_id), unnest(participants) as participant  
                WHERE (host_id = ${user.user_id} OR  participant  LIKE '%${user.email}%')
                AND  value_date BETWEEN '${fromDate}' AND '${toDate}'`;
        my_query += hostName ? ` AND CONCAT(first_name,' ',last_name) = '${hostName}'` : '';
        my_query += title ? ` AND title = '${title}'` : '';
        my_query += ` ORDER BY value_date`;

        let res = await db.query(my_query);
        for (i = 0; i < res.rows.length; i++) {
            res.rows[i].link = res.rows[i].link + user.first_name + '+' + user.last_name;
        }
        return res.rows;
    }
    catch (err) {
        throw err;
    }
}

const insertGoodWord = async (goodWord) => {
    await db.query(`
    INSERT INTO good_feedback (sender_id, receiver_id, committee_name, content, time) VALUES ($1, $2, $3, $4, $5)
    `, [goodWord.senderID, goodWord.receiverID, goodWord.committeeName, goodWord.content, new Date(Date.now())]);
};

/**
 * 
 * @param {*} parameters is an object that contain data to filter the query with it.
 */
const getGoodWordsFromDB = async (parameters) => {
    
    // Initial query
    let searchQuery = 'SELECT * FROM good_feedback ';

    // isObjectEmpty will be assigned true if all the values in parameters object are implicitly false.
    // Else, isObjectEmpty will be assigned false, meaning there's at least one value defined.
    const isObjectEmpty = Object.values(parameters).every(param => !param);

    // If isObjectEmpty is false OR state is explicitly assigned false OR null
    if (!isObjectEmpty || parameters.state === null || parameters.state === false) {
        
        searchQuery += 'WHERE ';

        // If state is explicitly defined as null
        if (parameters.state === null) {
            searchQuery += 'state IS NULL AND ';
        }

        // index for managing the query parameters
        let index = 1;
        for (const param in parameters) {

            // If the value is defined OR the value is explicitly defined as false
            if (parameters[param] || parameters[param] === false) {

                // Adjusting the query parameters index
                searchQuery += `${param}=$${index++} AND `;
            }
        }

        // Removing the last 5 chars (' AND ')
        searchQuery = searchQuery.slice(0, -5);
    }
    
    // Returns an array of the query parameters
    const queryParams = Object.values(parameters).filter(param => param || param === false);
    
    // Return the result of the dynamically adjusted query,
    // with an array of parameters for the query.
    const result = await db.query(searchQuery, queryParams);

    return result.rows;
};

const updateGoodWordInDB = async (goodWord) => {
    const result = await db.query(`
    UPDATE good_feedback
    SET state=$1
    WHERE serial_id=$2`, [goodWord.state, goodWord.serialNumber]);

    return result.rowCount !== 0;
}

const getLastRowOfTable = async (tableName, orderByValue) => {    
    const result = await db.query(`SELECT * FROM ${tableName} ORDER BY ${orderByValue} DESC`);
    const lastRow = result.rows[0];

    return lastRow;    
}

const getAllImagesFromDB = async () => {
    const result = await db.query('SELECT path, is_shown as status FROM image_rotation');

    return result.rows;
};

const getAllImagesByStatusFromDB = async (status) => {
    const result = await db.query(
        `SELECT path FROM image_rotation WHERE is_shown=$1`,
        [status]);
    
    return result.rows;
};

const insertImagesToDB = async (imagesInfo) => {
    let query = `
    INSERT INTO image_rotation (path, is_shown)
    VALUES `;

    imagesInfo.forEach(imageInfo => {
        query += `('${imageInfo.path}',${imageInfo.status}), `;
    });

    query = query.slice(0, -2);

    const result = await db.query(query);

    return result.rowCount !== 0;
};

const deleteImageFromDB = async (path) => {
    const result = await db.query(`
    DELETE FROM image_rotation
    WHERE path=$1`, [path]);

    return result.rowCount !== 0;
};

const updateImageStatusInDB = async (imagesInfo) => {
    let query = `UPDATE image_rotation SET is_shown=CASE `;

    imagesInfo.forEach(imageInfo => {
        query += `WHEN path='${imageInfo.path}' THEN ${imageInfo.status} `
    });

    query += `END WHERE path IN (`;
    
    imagesInfo.forEach(imageInfo => {
        query += `'${imageInfo.path}',`
    });

    query = query.slice(0, -1);
    query += `)`;

    const result = await db.query(query);

    return result.rowCount !== 0;
};

module.exports = {
    getAllUsersFromDB: getAllUsersFromDB,
    insertUserCredentialsToDB: insertUserCredentialsToDB,
    insertUserToDB: insertUserToDB,
    getUserById: getUserById,
    getUserByEmail: getUserByEmail,
    getUsersByGivenBirthday: getUsersByGivenBirthday,
    getUsersByEmail: getUsersByEmail,
    getDaysSinceLastPasswordChangeInDB: getDaysSinceLastPasswordChangeInDB,
    isUserInDB: isUserInDB,
    updateUserInDB: updateUserInDB,
    deleteUserFromDB: deleteUserFromDB,
    updateColumn: updateColumn,
    getAllInfoFromTable: getAllInfoFromTable,
    getApplicationByID: getApplicationByID,
    getAllApplicationsForUser: getAllApplicationsForUser,
    insertNewApplication: insertNewApplication,
    getInboxesByCommitteeNameFromDB: getInboxesByCommitteeNameFromDB,
    getInboxesBySenderIDFromDB: getInboxesBySenderIDFromDB,
    getReplyByInboxID: getReplyByInboxID,
    createNewReply: createNewReply,
    closeInboxInDB: closeInboxInDB,
    markAsSpamInDB: markAsSpamInDB,
    getAllCommitteeParticipantsDB: getAllCommitteeParticipantsDB,
    insertNewCommitteeParticipant: insertNewCommitteeParticipant,
    updateCommitteeParticipantRoleDB: updateCommitteeParticipantRoleDB,
    createNewCommittee: createNewCommittee,
    getCommitteeByName: getCommitteeByName,
    deleteCommitteeParticipantDB: deleteCommitteeParticipantDB,
    getAllCommitteeNamesAndDescFromDB: getAllCommitteeNamesAndDescFromDB,
    getAllCommitteeNamesAndRollsFromDB: getAllCommitteeNamesAndRollsFromDB,
    addRoom: addRoom,
    showFutureRooms: showFutureRooms,
    showPastRooms: showPastRooms,
    showBetweenRooms: showBetweenRooms,
    insertGoodWord: insertGoodWord,
    getGoodWordsFromDB: getGoodWordsFromDB,
    updateGoodWordInDB: updateGoodWordInDB,
    getLastRowOfTable: getLastRowOfTable,
    getAllImagesFromDB,
    getAllImagesByStatusFromDB,
    insertImagesToDB,
    deleteImageFromDB,
    updateImageStatusInDB
};