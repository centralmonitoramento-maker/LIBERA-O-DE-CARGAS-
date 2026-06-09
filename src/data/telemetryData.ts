export interface TelemetryRecord {
  ras_ras_id: string;
  ras_ras_id_aparelho: string;
  ras_cli_desc: string;
  ras_eve_latitude: string;
  ras_eve_longitude: string;
  ras_eve_velocidade: string;
  ras_eve_ignicao: string;
  ras_vei_placa: string;
  ras_eve_satelites?: string;
  ras_eve_data_gps?: string;
  ras_eve_porc_bat_backup?: string;
}

export const TELEMETRY_DATA: TelemetryRecord[] = [
  {
    ras_ras_id: "842372",
    ras_ras_id_aparelho: "869731056167174",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-15.877314",
    ras_eve_longitude: "-47.986102",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "BWU-8171",
    ras_eve_satelites: "8",
    ras_eve_data_gps: "17/09/2025 00:04:52",
    ras_eve_porc_bat_backup: "45"
  },
  {
    ras_ras_id: "842375",
    ras_ras_id_aparelho: "869731056166382",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-15.79361",
    ras_eve_longitude: "-47.989587",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "BWH-4H66",
    ras_eve_satelites: "9",
    ras_eve_data_gps: "22/05/2026 00:47:14",
    ras_eve_porc_bat_backup: "45"
  },
  {
    ras_ras_id: "842377",
    ras_ras_id_aparelho: "869731056160609",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.048686",
    ras_eve_longitude: "-47.972022",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "GKV-6G53",
    ras_eve_satelites: "11",
    ras_eve_data_gps: "08/06/2026 21:31:43",
    ras_eve_porc_bat_backup: "15"
  },
  {
    ras_ras_id: "1187163",
    ras_ras_id_aparelho: "356354871778255",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.04861",
    ras_eve_longitude: "-47.971631",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "OCL-8F70",
    ras_eve_satelites: "15",
    ras_eve_data_gps: "09/06/2026 15:39:32",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842376",
    ras_ras_id_aparelho: "869731056160179",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.128564",
    ras_eve_longitude: "-47.957644",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "BTS-1333",
    ras_eve_satelites: "11",
    ras_eve_data_gps: "09/06/2026 15:58:51",
    ras_eve_porc_bat_backup: "30"
  },
  {
    ras_ras_id: "1187166",
    ras_ras_id_aparelho: "356354871776713",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.04866",
    ras_eve_longitude: "-47.972951",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "CZC-6D14",
    ras_eve_satelites: "15",
    ras_eve_data_gps: "09/06/2026 16:07:42",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "1103718",
    ras_ras_id_aparelho: "863829070794050",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.048231",
    ras_eve_longitude: "-47.971867",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "GWI-4547",
    ras_eve_satelites: "6",
    ras_eve_data_gps: "09/06/2026 16:20:20",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842335",
    ras_ras_id_aparelho: "869731056160633",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.048638",
    ras_eve_longitude: "-47.972276",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "KTU-4C64",
    ras_eve_satelites: "11",
    ras_eve_data_gps: "09/06/2026 16:23:24",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842373",
    ras_ras_id_aparelho: "869731056167927",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.048348",
    ras_eve_longitude: "-47.971542",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "KHS-4E88",
    ras_eve_satelites: "12",
    ras_eve_data_gps: "09/06/2026 16:23:40",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842371",
    ras_ras_id_aparelho: "869731056157621",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.043646",
    ras_eve_longitude: "-47.965862",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "GWM-1F49",
    ras_eve_satelites: "8",
    ras_eve_data_gps: "09/06/2026 16:24:46",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "1186704",
    ras_ras_id_aparelho: "356354871777414",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.028469",
    ras_eve_longitude: "-48.02828",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "FIR-0B97",
    ras_eve_satelites: "15",
    ras_eve_data_gps: "09/06/2026 16:27:49",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842570",
    ras_ras_id_aparelho: "869731056167331",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.049608",
    ras_eve_longitude: "-48.036858",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "CXA-8I83",
    ras_eve_satelites: "12",
    ras_eve_data_gps: "09/06/2026 16:28:14",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842337",
    ras_ras_id_aparelho: "869731056160211",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.041843",
    ras_eve_longitude: "-47.965204",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "OVO-0378",
    ras_eve_satelites: "11",
    ras_eve_data_gps: "09/06/2026 16:30:16",
    ras_eve_porc_bat_backup: "75"
  },
  {
    ras_ras_id: "1103707",
    ras_ras_id_aparelho: "869731056173313",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-15.825876",
    ras_eve_longitude: "-47.978853",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "EWJ-6001",
    ras_eve_satelites: "13",
    ras_eve_data_gps: "09/06/2026 16:30:22",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842575",
    ras_ras_id_aparelho: "869731056155211",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.047987",
    ras_eve_longitude: "-47.971587",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "JFG-5078",
    ras_eve_satelites: "9",
    ras_eve_data_gps: "09/06/2026 16:30:55",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842572",
    ras_ras_id_aparelho: "869731056172729",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.04841",
    ras_eve_longitude: "-47.971049",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "FRZ-9797",
    ras_eve_satelites: "12",
    ras_eve_data_gps: "09/06/2026 16:31:16",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842338",
    ras_ras_id_aparelho: "869731056160666",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-15.794007",
    ras_eve_longitude: "-48.148018",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "KBU-1751",
    ras_eve_satelites: "11",
    ras_eve_data_gps: "09/06/2026 16:31:18",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842571",
    ras_ras_id_aparelho: "869731056152325",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.048204",
    ras_eve_longitude: "-47.971644",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "OMY-1B34",
    ras_eve_satelites: "8",
    ras_eve_data_gps: "09/06/2026 16:31:37",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842378",
    ras_ras_id_aparelho: "869731056173727",
    ras_cli_desc: "ATACADÃO DIA A DIA",
    ras_eve_latitude: "-16.048356",
    ras_eve_longitude: "-47.971369",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "AAH-7G72",
    ras_eve_satelites: "10",
    ras_eve_data_gps: "09/06/2026 16:31:38",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842578",
    ras_ras_id_aparelho: "869731056165236",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.048202",
    ras_eve_longitude: "-47.971582",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "GSW-3D02",
    ras_eve_satelites: "8",
    ras_eve_data_gps: "09/06/2026 16:32:31",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842340",
    ras_ras_id_aparelho: "869731056151764",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.072391",
    ras_eve_longitude: "-47.99108",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "CGS-7C69",
    ras_eve_satelites: "8",
    ras_eve_data_gps: "09/06/2026 16:32:54",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842336",
    ras_ras_id_aparelho: "869731056168503",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-15.566427",
    ras_eve_longitude: "-47.336053",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "IFP-5J30",
    ras_eve_satelites: "8",
    ras_eve_data_gps: "09/06/2026 16:33:16",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842341",
    ras_ras_id_aparelho: "869731056151798",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-15.815648",
    ras_eve_longitude: "-48.122787",
    ras_eve_velocidade: "55",
    ras_eve_ignicao: "1",
    ras_vei_placa: "CQH-2D12",
    ras_eve_satelites: "13",
    ras_eve_data_gps: "09/06/2026 16:34:01",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842574",
    ras_ras_id_aparelho: "869731056164635",
    ras_cli_desc: "ATACADÃO DIA A DIA",
    ras_eve_latitude: "-15.67368",
    ras_eve_longitude: "-47.821031",
    ras_eve_velocidade: "49",
    ras_eve_ignicao: "1",
    ras_vei_placa: "NGY-7119",
    ras_eve_satelites: "13",
    ras_eve_data_gps: "09/06/2026 16:34:11",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842342",
    ras_ras_id_aparelho: "869731056168115",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-15.905297",
    ras_eve_longitude: "-48.073556",
    ras_eve_velocidade: "8",
    ras_eve_ignicao: "0",
    ras_vei_placa: "BWP-1F60",
    ras_eve_satelites: "9",
    ras_eve_data_gps: "09/06/2026 16:34:11",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842333",
    ras_ras_id_aparelho: "869731056161375",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.007231",
    ras_eve_longitude: "-47.983284",
    ras_eve_velocidade: "59",
    ras_eve_ignicao: "1",
    ras_vei_placa: "KDL-7729",
    ras_eve_satelites: "9",
    ras_eve_data_gps: "09/06/2026 16:34:26",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842370",
    ras_ras_id_aparelho: "869731056160799",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-15.688692",
    ras_eve_longitude: "-47.860596",
    ras_eve_velocidade: "65",
    ras_eve_ignicao: "1",
    ras_vei_placa: "BYE-9369",
    ras_eve_satelites: "11",
    ras_eve_data_gps: "09/06/2026 16:34:31",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "1103712",
    ras_ras_id_aparelho: "863829073681080",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.060116",
    ras_eve_longitude: "-47.982462",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "CLH-3A45",
    ras_eve_satelites: "13",
    ras_eve_data_gps: "09/06/2026 16:34:32",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842330",
    ras_ras_id_aparelho: "869731056161417",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.048346",
    ras_eve_longitude: "-47.971431",
    ras_eve_velocidade: "0",
    ras_eve_ignicao: "0",
    ras_vei_placa: "BWC-1E46",
    ras_eve_satelites: "6",
    ras_eve_data_gps: "09/06/2026 16:34:50",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842573",
    ras_ras_id_aparelho: "869731056228570",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-15.980216",
    ras_eve_longitude: "-47.988271",
    ras_eve_velocidade: "51",
    ras_eve_ignicao: "1",
    ras_vei_placa: "KBA-4750",
    ras_eve_satelites: "11",
    ras_eve_data_gps: "09/06/2026 16:34:54",
    ras_eve_porc_bat_backup: "100"
  },
  {
    ras_ras_id: "842576",
    ras_ras_id_aparelho: "869731056161177",
    ras_cli_desc: "ATACADAO DIA A DIA",
    ras_eve_latitude: "-16.049762",
    ras_eve_longitude: "-47.982271",
    ras_eve_velocidade: "32",
    ras_eve_ignicao: "1",
    ras_vei_placa: "OMJ-5997",
    ras_eve_satelites: "13",
    ras_eve_data_gps: "09/06/2026 16:34:57",
    ras_eve_porc_bat_backup: "100"
  }
];

export const getUniquePlatesRaw = (): string[] => {
  const plates = TELEMETRY_DATA.map(t => t.ras_vei_placa);
  return Array.from(new Set(plates));
};

export const getUniquePlatesNormalized = (): string[] => {
  const plates = getUniquePlatesRaw().map(p => p.toUpperCase().replace(/[^A-Z0-9]/g, ""));
  return Array.from(new Set(plates));
};
