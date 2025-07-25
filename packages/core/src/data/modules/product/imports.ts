import { generateModels } from "../../../connectionResolver";

export default {
  insertImportItems: async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);

    const { docs } = data;
    console.log({ docs });

    let updated = 0;
    const objects: any = [];

    try {
      for (const doc of docs) {
        if (doc.code) {
          const product = await models.Products.findOne({ code: doc.code });

          if (product) {
            delete doc.code;
            await models.Products.updateOne(
              { _id: product._id },
              { $set: { ...doc } }
            );
            updated++;
          } else {
            const insertedProduct = await models.Products.create(doc);

            objects.push(insertedProduct);
          }
        } else {
          const insertedProduct = await models.Products.create(doc);

          objects.push(insertedProduct);
        }
      }

      return { objects, updated };
    } catch (e) {
      return { error: e.message };
    }
  },

  prepareImportDocs: async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);
    const { result, properties } = data;

    const defaultUom = await models.ProductsConfigs.getConfig("defaultUOM", "");

    const bulkDoc: any = [];

    // Iterating field values
    for (const fieldValue of result) {
      const doc: any = {
        customFieldsData: []
      };

      let colIndex: number = 0;
      let subUomNames = [];
      let ratios = [];

      console.log({ properties });

      // Iterating through detailed properties
      for (const property of properties) {
        const value = (fieldValue[colIndex] || "").toString();

        switch (property.name) {
          case "customProperty":
            {
              doc.customFieldsData.push({
                field: property.id,
                value: fieldValue[colIndex]
              });

              doc.customFieldsData =
                await models.Fields.prepareCustomFieldsData(
                  doc.customFieldData
                );
            }
            break;

          case "categoryName":
            {
              const generateCode = Math.floor(Math.random() * 900) + 100;

              let category = await models.ProductCategories.findOne({
                name: { $regex: new RegExp(`^${value}$`, "i") }
              });

              if (!category) {
                category = await models.ProductCategories.create({
                  name: value,
                  code: generateCode,
                  order: `${generateCode}/`
                });
              }

              doc.categoryId = category ? category._id : "";
            }

            break;

          case "tag":
            {
              const tagName = value;

              let tag = await models.Tags.findOne({
                name: tagName,
                type: `core:product`
              });

              if (!tag) {
                tag = await models.Tags.create({
                  name: tagName,
                  type: `core:product`
                });
              }

              doc.tagIds = tag ? [tag._id] : [];
            }

            break;

          case "barcodes":
            {
              doc.barcodes = value
                .replace(/\s/g, "")
                .split(",")
                .filter((br) => br);
            }
            break;

          case "subUoms.uom":
            {
              subUomNames = value.replace(/\s/g, "").split(",");
            }
            break;

          case "subUoms.ratio":
            {
              ratios = value.replace(/\s/g, "").split(",");
            }
            break;

          case "uom":
            {
              doc.uom = value || defaultUom;
            }
            break;

          case "unitPrice": {
            doc.unitPrice =
              typeof value === "string"
                ? Number(value.replace(/,/g, ""))
                : value;

            break;
          }
          default:
            {
              doc[property.name] = value;

              if (property.name === "createdAt" && value) {
                doc.createdAt = new Date(value);
              }

              if (property.name === "modifiedAt" && value) {
                doc.modifiedAt = new Date(value);
              }

              if (property.name === "isComplete") {
                doc.isComplete = Boolean(value);
              }
            }
            break;
        }

        colIndex++;
      }

      let ind = 0;
      const subUoms: any = [];

      for (const uom of subUomNames) {
        subUoms.push({
          id: Math.random(),
          uom: uom,
          ratio: Number(ratios[ind] || 1)
        });
        ind += 1;
      }
      doc.subUoms = subUoms;

      bulkDoc.push(doc);
    }

    console.log({ bulkDoc });

    return bulkDoc;
  }
};
