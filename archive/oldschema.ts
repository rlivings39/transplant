// // Generated from Supabase schema
// export type PreparationType =
// 	| 'raw'
// 	| 'mechanical'
// 	| 'chemical'
// 	| 'burned'
// 	| 'grass seed'
// 	| 'landscaped';

// export interface BaseEntity {
// 	created_at?: string;
// 	last_edited_at?: string;
// 	edited_by?: string;
// 	deleted?: boolean;
// 	// notes field removed from BaseEntity and added specifically to each entity
// }

// export interface Land extends BaseEntity {
// 	land_id: string;
// 	land_name: string;
// 	hectares?: number;
// 	land_holder?: string;
// 	gps_lat?: number;
// 	gps_lon?: number;
// 	polygon_id?: string;
// 	preparation?: PreparationType;
// 	preparation_id?: number;
// 	project_id?: string;
// 	land_notes?: string;
// }

// export interface Crop extends BaseEntity {
// 	crop_id: string;
// 	crop_name: string;
// 	species_id?: string;
// 	organization_id?: string;
// 	project_id?: string;
// 	crop_stock?: string;
// 	seed_info?: string;
// 	crop_notes?: string;
// }

// export interface Planting extends BaseEntity {
// 	id: string;
// 	land_id?: string;
// 	crop_id?: string;
// 	planted?: number;
// 	planting_date?: string;
// 	notes?: string; // Keeping original notes field for Planting
// }

// export interface Polygon extends BaseEntity {
// 	polygon_id: string;
// 	land_id?: string;
// 	geojson?: unknown;
// 	poly_notes?: string;
// }

// export interface Project extends BaseEntity {
// 	project_id: string;
// 	project_name: string;
// 	project_notes?: string;
// }

// export interface Stakeholder extends BaseEntity {
// 	stakeholder_id: string;
// 	stakeholder_name?: string;
// 	stake_notes?: string;
// }

// export interface Species extends BaseEntity {
// 	species_id: string;
// 	scientific_name?: string;
// 	common_name?: string;
// 	family?: string;
// 	type?: string;
// 	reference?: string;
// 	notes?: string; // Keeping original notes field for Species
// }

// export interface Organization extends BaseEntity {
// 	organization_id: string;
// 	organization_name?: string;
// 	contact_name?: string;
// 	contact_email?: string;
// 	contact_phone?: string;
// 	address?: string;
// 	website?: string;
// 	is_nursery?: boolean;
// 	gps_lat?: number;
// 	gps_lon?: number;
// 	notes?: string; // Keeping original notes field for Organization
// }
