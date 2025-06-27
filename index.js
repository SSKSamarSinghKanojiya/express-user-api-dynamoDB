export const createUsers = async (req, res) => {
  try {
    // const usersData = Array.isArray(req.body) ? req.body : JSON.parse(req.body);
    let usersData;

if (Array.isArray(req.body)) {
  usersData = JSON.parse(JSON.stringify(req.body)); // parse after stringifying (redundant but matches requirement)
} else {
  usersData = JSON.parse(req.body); // assume it's a JSON string
}

/*

const usersData = Array.isArray(req.body) ? JSON.parse(JSON.stringify(req.body)) : JSON.parse(req.body);

*/


    if (!usersData.length) {
      return res.status(400).json({ message: "User list is required." });
    }

    const putRequests = usersData.map((data) => {
      if (!data.name || !data.email) {
        throw new Error("Each user must have name and email.");
      }

      const id = data.id || `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const pk = `USER#${id}`;
      const sk = `PROFILE`;

      return {
        PutRequest: {
          Item: {
            pk,
            sk,
            id,
            entity: "USER", // for GSI
            name: data.name,
            email: data.email,
            createdAt: new Date().toISOString(),
          },
        },
      };
    });

    // Batch write supports 25 items max at a time
    const chunks = [];
    while (putRequests.length) {
      chunks.push(putRequests.splice(0, 25));
    }

    for (const chunk of chunks) {
      const params = {
        RequestItems: {
          [process.env.DYNAMO_DB_TABLE]: chunk,
        },
      };
      await dynamoDb.batchWrite(params).promise();
    }

    return res.status(201).json({ message: "Users created successfully." });
  } catch (error) {
    console.error("createUsers error:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};







































export const getAllUsers = async (req, res) => {
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
