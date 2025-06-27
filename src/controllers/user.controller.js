const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.DYNAMO_DB_TABLE;
const generateId = () => `user_${Date.now()}`;


export const createUser = async (req, res) => {
  try {
    console.log("Incoming body:", req.body); // 👈 ADD THIS
    const data = JSON.parse(req.body);
    // const data = req.body;
    const id = data.id || `user_${Date.now()}`;
    const pk = `USER#${id}`;
    const sk = `PROFILE`;

    if (!data.name || !data.email) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    const user = {
      pk,
      sk,
      id,
      name: data.name,
      email: data.email,
      createdAt: new Date().toISOString(),
    };

    await dynamoDb.put({ TableName: tableName, Item: user }).promise();

    return res.status(201).json({ message: "User Successfully Created", user });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// create user another
/*
export const createUser1 = async(req,res)=>{
  try {
    const usersData = Array.isArray(req.body) ? JSON.parse(JSON.stringify(req.body)): JSON.parse(req.body)

    if (!usersData.length) {
      return res.status(400).json({message:"User list is required."})
    }

    const putRequests = usersData.map((data)=>{
      if (!data.name || !data.email) {
        throw new Error("Each user must have name and email.")
      }
      const id = data.id || `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const pk = `USER#_${id}`;
      const sk = `PROFILE`

      return {
        PutRequest :{
          Item: {
            pk,sk,id,entity: "USER", // for GSI
          name: data.name,
          email: data.email,
          createdAt: new Date().toISOString()
          }
        }
      }
    })

    // Batch write supports 25 items max at a time

    const chunks = []
    while(putRequests.length){
      chunks.push(putRequests.splice(0,25))
    }

    for(const chunk of chunks){
      const params = {
        RequestItems: {
          [tableName]: chunk
        }
      }
      await dynamoDb.batchWrite(params).promise()
    }
    return res.status(201).json({message:"Users created successfully."})
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message});
  }
}
  */

// Exporting the createUser1 function as an Express route handler
export const createUser1 = async (req, res) => {
  try {
    /**
     * Step 1: Parse input data
     * If the request body is already a parsed array (like from Postman or frontend),
     * use it directly. Otherwise, parse the raw JSON string (in case of raw body).
     */
    const usersData = Array.isArray(req.body)
      ? req.body
      : JSON.parse(req.body);

    /**
     * Step 2: Validate that usersData is not empty.
     * If no users provided, return 400 error.
     */
    if (!usersData.length) {
      return res.status(400).json({ message: "User list is required." });
    }

    /**
     * Step 3: Store successfully created user objects for response
     */
    const insertedUsers = [];

    /**
     * Step 4: Transform each user object into a DynamoDB PutRequest
     */
    const putRequests = usersData.map((data) => {
      // Step 4.1: Validate required fields for each user
      if (!data.name || !data.email) {
        throw new Error("Each user must have name and email.");
      }

      /**
       * Step 4.2: Generate a unique ID if not provided by the client
       * Format: user_<timestamp>_<random_number>
       */
      const id = data.id || `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      /**
       * Step 4.3: Define primary key (pk) and sort key (sk) for DynamoDB
       * pk format = USER#<id>
       * sk = PROFILE (static, to differentiate future records like logs, stats, etc.)
       */
      const pk = `USER#${id}`;
      const sk = "PROFILE";

      /**
       * Step 4.4: Capture created timestamp in ISO format
       */
      const createdAt = new Date().toISOString();

      /**
       * Step 4.5: Define the user item object to insert into DynamoDB
       */
      const userItem = {
        pk,               // Partition key
        sk,               // Sort key
        id,               // User ID
        entity: "USER",   // For GSI (Global Secondary Index) filtering
        name: data.name,  // User's name
        email: data.email, // User's email
        createdAt,         // Timestamp
      };

      /**
       * Step 4.6: Save to the insertedUsers array for the response later
       */
      insertedUsers.push(userItem);

      /**
       * Step 4.7: Return the PutRequest for DynamoDB batchWrite
       */
      return {
        PutRequest: {
          Item: userItem,
        },
      };
    });

    /**
     * Step 5: DynamoDB batchWrite can only insert 25 items per request.
     * So we split the putRequests array into chunks of 25 items max.
     */
    const chunks = [];
    while (putRequests.length) {
      chunks.push(putRequests.splice(0, 25)); // take 25 items per chunk
    }

    /**
     * Step 6: Send each chunk to DynamoDB using batchWrite
     */
    for (const chunk of chunks) {
      const params = {
        RequestItems: {
          [process.env.DYNAMO_DB_TABLE]: chunk, // use environment variable for table name
        },
      };

      // Execute batch write operation
      await dynamoDb.batchWrite(params).promise();
    }

    /**
     * Step 7: Send final response with all inserted users
     */
    return res.status(201).json({
      message: "Users created successfully.", // Success message
      inserted: insertedUsers,               // Return inserted user objects
    });

  } catch (error) {
    /**
     * Catch any errors that occur during processing and return 500 error
     */
    console.error("Error creating user:", error);
    return res.status(500).json({
      message: "Internal Server Error", // Error message
      error: error.message,             // Detailed error for debugging
    });
  }
};



// Get User By Id
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Incoming ID:", id); // ✅ Log to verify input

    const pk = `USER#${id}`;
    const sk = `PROFILE`;

    const result = await dynamoDb
      .get({
        TableName: tableName,
        Key: { pk, sk },
      })
      .promise();

    console.log("Fetched item:", result.Item); // ✅ Debug log

    if (!result.Item) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(result.Item);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};


export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    // const { name, email } = req.body;
    // const data = JSON.parse(req.body)
    const {name,email} = JSON.parse(req.body)
  console.log("Body Received:", req.body);

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    const pk = `USER#${id}`;
    const sk = `PROFILE`;

    const found = await dynamoDb
      .get({ TableName: tableName, Key: { pk, sk } })
      .promise();

    if (!found.Item) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await dynamoDb
      .update({
        TableName: tableName,
        Key: { pk, sk },
        UpdateExpression: "SET #name = :name, email = :email",
        ExpressionAttributeNames: {
          "#name": "name"
        },
        ExpressionAttributeValues: {
          ":name": name,
          ":email": email,
        },
        ReturnValues: "ALL_NEW",
      })
      .promise();

    return res.status(200).json(result.Attributes);
  } catch (error) {
    console.error("updateUser error:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// delete User
export const deleteUser = async(req,res)=>{
  try {
    const {id} = req.params
    const pk = `USER#${id}`
    const sk = `PROFILE`;

    const found = await dynamoDb.get({TableName: tableName, Key: {pk,sk}}).promise()

    if (!found.Item) {
      return res.status(404).json({ message: "User not found" });
    }
    await dynamoDb.delete({TableName: tableName, Key:{pk,sk}}).promise()
    return res.status(201).json({ message: "User Deleted Successfully", found });
  } catch (error) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}


// Get All
export const getAllUsers = async(req,res)=>{
  try {
    const params = {
      TableName: process.env.DYNAMO_DB_TABLE,
      FilterExpression: "begins_with(pk, :prefix)",
      ExpressionAttributeValues: {
        ":prefix": "USER#"
      }
    }
    const result = await dynamoDb.scan(params).promise()
    return res.status(200).json(result.Items);
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

export const getAllUsers1 = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", sort = "asc" } = req.query;

    const params = {
      TableName: process.env.DYNAMO_DB_TABLE,
      IndexName: "GSI1",
      KeyConditionExpression: "#entity = :entityVal",
      ExpressionAttributeNames: {
        "#entity": "entity",
      },
      ExpressionAttributeValues: {
        ":entityVal": "USER",
      },
      Limit: parseInt(limit),
      ScanIndexForward: sort === "asc", // true = ASC, false = DESC
    };

    // Start key for pagination
    let lastEvaluatedKey = null;
    let scannedCount = 0;
    let items = [];

    do {
      if (lastEvaluatedKey) params.ExclusiveStartKey = lastEvaluatedKey;

      const data = await dynamoDb.query(params).promise();

      let filtered = data.Items;
      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter((item) =>
          item.name?.toLowerCase().includes(query) || item.email?.toLowerCase().includes(query)
        );
      }

      items = items.concat(filtered);
      scannedCount += filtered.length;
      lastEvaluatedKey = data.LastEvaluatedKey;

    } while (items.length < page * limit && lastEvaluatedKey);

    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    return res.status(200).json({
      total: items.length,
      currentPage: parseInt(page),
      limit: parseInt(limit),
      users: paginatedItems,
    });

  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


export const getUserByEmail = async(req,res)=>{
  try {
    const email = req.query.email
    if (!email || email.trim()==="") {
      return res.status(400).json({message:"Email query parameter is required."})
    }
    const params = {
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues:{
        ':email': email
      }
    }

    const result  = await dynamoDb.query(params).promise()
    return res.status(200).json(result.Items)
  } catch (error) {
    console.error('DynamoDB query failed:', error);
    return res.status(500).json({ message: error.message });
  }
}

