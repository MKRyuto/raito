const fs = require("fs");
const https = require("https");
const path = require("path");

(async () => {
  // Get Data from https://arknights-poll.net
  console.log("Get Data arknights-poll.net ...");
  const requestOpB6Data = await fetch(
    "https://arknights-poll.net/data/base.json"
  );
  const opB6Data = await requestOpB6Data.json();
  const requestOpB6DetailData = await fetch(
    "https://arknights-poll.net/data/stats.json"
  );
  const opB6DetailData = await requestOpB6DetailData.json();
  // Get Data from https://aceship.github.io
  console.log("Get Data aceship.github.io ...");
  const responseCharCnInfo = await fetch(
    "https://aceship.github.io/AN-EN-Tags/json/gamedata/zh_CN/gamedata/excel/character_table.json"
  );
  const CharCnInfo = await responseCharCnInfo.json();
  const responseCharEnInfo = await fetch(
    "https://aceship.github.io/AN-EN-Tags/json/gamedata/en_US/gamedata/excel/character_table.json"
  );
  const CharEnInfo = await responseCharEnInfo.json();
  const responseSkillCnInfo = await fetch(
    "https://aceship.github.io/AN-EN-Tags/json/gamedata/zh_CN/gamedata/excel/skill_table.json"
  );
  const skillCnInfoData = await responseSkillCnInfo.json();
  const responseSkillEnInfo = await fetch(
    "https://aceship.github.io/AN-EN-Tags/json/gamedata/en_US/gamedata/excel/skill_table.json"
  );
  const skillEnInfoData = await responseSkillEnInfo.json();
  const responseModuleCnInfo = await fetch(
    "https://aceship.github.io/AN-EN-Tags/json/gamedata/zh_CN/gamedata/excel/uniequip_table.json"
  );
  const moduleCnInfoData = await responseModuleCnInfo.json();
  const responseModuleEnInfo = await fetch(
    "https://aceship.github.io/AN-EN-Tags/json/gamedata/en_US/gamedata/excel/uniequip_table.json"
  );
  const moduleEnInfoData = await responseModuleEnInfo.json();
  function upgradePoll(stats) {
    total_owner =
      stats.selections[1] + stats.selections[2] + stats.selections[3];
    return {
      holding_rate: `${((total_owner / stats.total) * 100).toFixed(2)}`,
      non_elite: `${((stats.selections[1] / total_owner) * 100).toFixed(2)}`,
      elite_one: `${((stats.selections[2] / total_owner) * 100).toFixed(2)}`,
      elite_two: `${((stats.selections[3] / total_owner) * 100).toFixed(2)}`,
    };
  }
  function skillPoll(stats) {
    return {
      unspecialized: `${((stats.selections[0] / stats.total) * 100).toFixed(
        2
      )}`,
      specialization_one: `${(
        (stats.selections[1] / stats.total) *
        100
      ).toFixed(2)}`,
      specialization_two: `${(
        (stats.selections[2] / stats.total) *
        100
      ).toFixed(2)}`,
      specialization_three: `${(
        (stats.selections[3] / stats.total) *
        100
      ).toFixed(2)}`,
    };
  }
  function modulePoll(stats) {
    return {
      unlocked: `${((stats.selections[0] / stats.total) * 100).toFixed(2)}`,
      level_one: `${((stats.selections[1] / stats.total) * 100).toFixed(2)}`,
      level_two: `${((stats.selections[2] / stats.total) * 100).toFixed(2)}`,
      level_three: `${((stats.selections[3] / stats.total) * 100).toFixed(2)}`,
    };
  }
  function upload(url, fileName) {
    const folder = "./public/arknights";
    const filePath = path.join(folder, fileName);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      https
        .get(url, (response) => {
          const file = fs.createWriteStream(`${folder}/${fileName}`);
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            console.log(`${fileName} saved successfully`);
          });
        })
        .on("error", (error) => {
          console.log("Error downloading image:", error);
        });
    }
    return `${fileName}`;
  }
  const mappedOpB6Data = opB6Data.map((item) => {
    const upgradeData = upgradePoll(opB6DetailData.stats[item.id]);
    const indexCharInfo = Object.keys(CharCnInfo).find(
      (key) => CharCnInfo[key].name === item.name
    );
    return Object.assign(
      {
        id: item.id,
        profession: CharCnInfo[indexCharInfo]["profession"],
        cn_name: item.name,
        en_name:
          typeof CharEnInfo[indexCharInfo] === "undefined"
            ? CharCnInfo[indexCharInfo]["appellation"]
            : CharEnInfo[indexCharInfo]["name"],
        image: upload(
          `https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avatars/${indexCharInfo}.png`,
          `${indexCharInfo}.png`
        ),
        number_sample: opB6DetailData.stats[item.id].total,
      },
      upgradeData,
      {
        skills: item.skills.map((skill, index) => {
          const skillData = skillPoll(opB6DetailData.stats[skill.id]);
          const skillId = CharCnInfo[indexCharInfo].skills[index].skillId;
          return Object.assign(
            {
              id: skill.id,
              type: index + 1,
              cn_name: skill.name,
              en_name:
                typeof skillEnInfoData[skillId] === "undefined"
                  ? "-"
                  : skillEnInfoData[skillId]["levels"][0]["name"],
              image: upload(
                `https://raw.githubusercontent.com/Aceship/Arknight-Images/main/skills/skill_icon_${
                  skillCnInfoData[skillId].iconId
                    ? skillCnInfoData[skillId].iconId
                    : skillId
                }.png`,
                `${skillId}.png`
              ),
            },
            skillData
          );
        }),
        modules: item.equipments.map((module) => {
          const moduleData = modulePoll(opB6DetailData.stats[module.id]);
          const moduleId = Object.values(moduleCnInfoData.equipDict).find(
            (obj) => obj.uniEquipName === module.name
          ).uniEquipId;
          return Object.assign(
            {
              id: module.id,
              type: moduleCnInfoData.equipDict[moduleId].typeName2,
              cn_name: module.name,
              en_name:
                typeof moduleEnInfoData.equipDict[moduleId] === "undefined"
                  ? "-"
                  : moduleEnInfoData.equipDict[moduleId].uniEquipName,
              image: upload(
                `https://raw.githubusercontent.com/Aceship/Arknight-Images/main/equip/icon/${
                  moduleCnInfoData.equipDict[moduleId].uniEquipIcon
                    ? moduleCnInfoData.equipDict[moduleId].uniEquipIcon
                    : moduleId
                }.png`,
                `${moduleId}.png`
              ),
            },
            moduleData
          );
        }),
      }
    );
  });
  // Write the mapped data to a file
  if (!fs.existsSync("./public/json")) {
    fs.mkdirSync("./public/json", { recursive: true });
  }
  fs.writeFile(
    "./public/json/test.json",
    JSON.stringify(mappedOpB6Data, null, 2),
    (err) => {
      if (err) throw err;
      console.log("Data written to file");
    }
  );
})();
