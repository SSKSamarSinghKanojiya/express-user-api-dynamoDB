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


// Update
// export const updateUser = async(req,res)=>{
//   try {
//     const { id } = req.params;
//     console.log("Incoming ID:", id); // ✅ Log to verify input
//     const { name, email } = req.body;
//     // const data = JSON.parse(req.body)
//     const pk = `USER#${id}`;
//     const sk = `PROFILE`;

//     const found = await dynamoDb.get({TableName: tableName, Key:{pk,sk}}).promise()

//     if (!found.Item) {
//       return res.status(404).json({message:"User not found"})
//     }
//     const result = await dynamoDb.update({
//       TableName: tableName,
//        Key: { pk, sk },
//       UpdateExpression: "SET #name = :name, email = :email",
//       ExpressionAttributeNames:{
//         "#name": "name"
//       },
//       ExpressionAttributeValues:{
//         ":name": name,
//         ":email": email
//       },
//       ReturnValues: "ALL_NEW"
//     }).promise()

//     return res.status(200).json(result.Attributes)

//   } catch (error) {
//     console.error("updateUser error:", error);
//     return res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// }
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
/*
module.exports.updateUser = async (event) => {
  const { id } = event.pathParameters;
  const data = JSON.parse(event.body);
  const pk = `USER#${id}`;
  const sk = `PROFILE`;

  const found = await dynamoDb
    .get({ TableName: tableName, Key: { pk, sk } })
    .promise();

  if (!found.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "User not found" }),
    };
  }
  const result = await dynamoDb
    .update({
      TableName: tableName,
      Key: { pk, sk },
      UpdateExpression: "SET #name = :name, email = :email",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: {
        ":name": data.name,
        ":email": data.email,
      },
      ReturnValues: "ALL_NEW",
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify(result.Attributes),
  };
};

// Delete
module.exports.deleteUser = async (event) => {
  const { id } = event.pathParameters;
  const pk = `USER#${id}`;
  const sk = `PROFILE`;

  const found = await dynamoDb
    .get({ TableName: tableName, Key: { pk, sk } })
    .promise();

  if (!found.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "User not found" }),
    };
  }
  await dynamoDb.delete({ TableName: tableName, Key: { pk, sk } }).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "User deleted" }),
  };
};
*/

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

/*
// Get By Email using GSI
module.exports.getUserByEmail = async (event) => {
  const email = event.queryStringParameters?.email;

  if (!email || email.trim() === "") {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Email query parameter is required." }),
    };
  }

  const params = {
    TableName: process.env.DYNAMO_DB_TABLE,
    IndexName: "GSI1",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email,
    },
  };

  try {
    const result = await dynamoDb.query(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};
*/