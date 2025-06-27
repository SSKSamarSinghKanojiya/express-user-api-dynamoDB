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

