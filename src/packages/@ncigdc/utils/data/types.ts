export interface IDataCategory {
  case_count?: number;
  data_category: TCategory;
  file_count?: number;
};

export interface IDataType {
  case_count?: number;
  data_type: TType;
  file_count?: number;
};

// waiting on $Values
export type TCategory =
  | 'Sequencing Reads'
  | 'Transcriptome Profiling'
  | 'Simple Nucleotide Variation'
  | 'Copy Number Variation'
  | 'Clinical'
  | 'DNA Methylation'
  | 'Biospecimen';

export type TCategoryAbbr =
  | 'Bio'
  | 'Clinical'
  | 'CNV'
  | 'Exp'
  | 'Meth'
  | 'Seq'
  | 'SNV';
  
export type TType = 
  | 'Transcriptomics'
  | 'Whole Slide Images';
  
export type TTypeAbbr = 
  | 'Trans'
  | 'WSI';

export type TCategoryMap = { [k in TCategoryAbbr]: TCategory };
export type TTypeMap = { [k in TTypeAbbr]: TType };

export type TFindDataCategory = (
  category: TCategoryAbbr,
  categories: IDataCategory[]
) => IDataCategory;

export type TFindDataType = (
  type: TTypeAbbr,
  types: IDataType[]
) => IDataType;

export type TSumDataCategories = (categories: IDataCategory[]) => number;
