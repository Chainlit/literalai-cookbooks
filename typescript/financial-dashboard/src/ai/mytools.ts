// const displayBarChartTool = tool({
//     description: displayBarChartJson?.description || '',
//     parameters: jsonSchema<{
//       query: string;
//       labelOutputColumn: string;
//       valueOutputColumn: string;
//     }>(displayBarChartJson?.parameters),
//     execute: async ({
//       query,
//       labelOutputColumn,
//       valueOutputColumn,
//     }) => {
//       console.log("displayBarChart");
//       const placeholder = appendPlaceholder();
//       const {result} = await queryDatabase(query, [
//         labelOutputColumn,
//         valueOutputColumn,
//       ]);

//       return {
//         placeholder,
//         name: "DataBarChart",
//         props: {
//           entries: result.map((row) => ({
//             name: row[labelOutputColumn],
//             value: row[valueOutputColumn],
//           })),
//         },
//       };
//     },
//   });


// const displayListTool = tool({
//     description: displayListJson?.description || '',
//   parameters: z.object({
//     query: z.string().describe(displayListJson?.parameters.properties.query.description || ''),
//     outputColumn: z
//       .string()
//       .describe("the name of the column in the JSON result"),
//   }),
//   execute: async ({ query, outputColumn }) => {
//     console.log("displayList");
//     const placeholder = appendPlaceholder();
//     const result = await queryDatabaseSimple(query, [outputColumn]);
//     return {
//       placeholder,
//       name: "DataList",
//       props: { values: result.map((row) => row[outputColumn]) },
//     };
//   },
// });



// const displaySingleValueTool = tool({
//     description: [
//       "Display a single data point.",
//       "Use to answer very simple question, with a value or a name.",
//     ].join("\n"),
//     parameters: z.object({
//       query: z.string().describe(displaySingleValueJson?.parameters.properties.query.description || ''),
//     }),
//     execute: async ({ query }) => {
//       const result = await queryDatabaseSimple(query);
//       const subResult = await streamText({
//         model: openai("gpt-4o"),
//         messages: [
//           ...history,
//           {
//             role: "system",
//             content: "With result: " + JSON.stringify(result),
//           },
//         ],
//       });

//       for await (const chunk of subResult.textStream) {
//         appendDelta(chunk);
//       }
//       return null;
//     },
//   });

