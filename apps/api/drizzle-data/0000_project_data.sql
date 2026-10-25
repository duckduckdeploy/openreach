CREATE TABLE "api_cache" (
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"cost_usd" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "api_cache_user_id_key_pk" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
CREATE TABLE "creators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"platform_id" text NOT NULL,
	"handle" text NOT NULL,
	"name" text,
	"url" text NOT NULL,
	"followers" integer,
	"avg_views" double precision,
	"engagement_rate" double precision,
	"emails" text[] DEFAULT '{}'::text[] NOT NULL,
	"country" text,
	"data" jsonb NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"analysed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_search_places" (
	"search_id" uuid NOT NULL,
	"place_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"matched" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_search_places_search_id_place_id_pk" PRIMARY KEY("search_id","place_id")
);
--> statement-breakpoint
CREATE TABLE "lead_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"queries" text[] NOT NULL,
	"locations" text[] DEFAULT '{}'::text[] NOT NULL,
	"mode" text DEFAULT 'text' NOT NULL,
	"grid" jsonb,
	"pages" integer DEFAULT 1 NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"filters" jsonb,
	"auto_save" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"total_calls" integer DEFAULT 0 NOT NULL,
	"done_calls" integer DEFAULT 0 NOT NULL,
	"found" integer DEFAULT 0 NOT NULL,
	"matched" integer DEFAULT 0 NOT NULL,
	"saved" integer DEFAULT 0 NOT NULL,
	"cost_usd" double precision DEFAULT 0 NOT NULL,
	"error" text,
	"heartbeat_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"place_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"phone" text,
	"website" text,
	"domain" text,
	"rating" double precision,
	"reviews" integer,
	"address" text,
	"emails" text[] DEFAULT '{}'::text[] NOT NULL,
	"data" jsonb NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"search_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitor_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"url" text NOT NULL,
	"source_id" text NOT NULL,
	"title" text NOT NULL,
	"snippet" text DEFAULT '' NOT NULL,
	"community" text,
	"author" text,
	"published_at" timestamp with time zone,
	"comments" integer,
	"score" integer,
	"intent" integer DEFAULT 0 NOT NULL,
	"sentiment" text DEFAULT 'neutral' NOT NULL,
	"signals" text[] DEFAULT '{}'::text[] NOT NULL,
	"ai_note" text,
	"relevant" boolean DEFAULT true NOT NULL,
	"term" text,
	"status" text DEFAULT 'new' NOT NULL,
	"first_run_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitor_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitor_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"trigger" text DEFAULT 'manual' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"searches_total" integer DEFAULT 0 NOT NULL,
	"searches_done" integer DEFAULT 0 NOT NULL,
	"found" integer DEFAULT 0 NOT NULL,
	"added" integer DEFAULT 0 NOT NULL,
	"cost_usd" double precision DEFAULT 0 NOT NULL,
	"warnings" text[] DEFAULT '{}'::text[] NOT NULL,
	"error" text,
	"heartbeat_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"terms" text[] NOT NULL,
	"excludes" text[] DEFAULT '{}'::text[] NOT NULL,
	"competitors" text[] DEFAULT '{}'::text[] NOT NULL,
	"sources" text[] NOT NULL,
	"depth" integer DEFAULT 10 NOT NULL,
	"ai_scoring" boolean DEFAULT false NOT NULL,
	"schedule" text DEFAULT 'daily' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"description" text,
	"keywords" text[] DEFAULT '{}'::text[] NOT NULL,
	"competitors" text[] DEFAULT '{}'::text[] NOT NULL,
	"location_code" integer DEFAULT 2840 NOT NULL,
	"location_name" text DEFAULT 'United States' NOT NULL,
	"country" text DEFAULT 'us' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creators" ADD CONSTRAINT "creators_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_search_places" ADD CONSTRAINT "lead_search_places_search_id_lead_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."lead_searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_searches" ADD CONSTRAINT "lead_searches_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitor_runs" ADD CONSTRAINT "monitor_runs_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitors" ADD CONSTRAINT "monitors_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_cache_expiry_idx" ON "api_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "creators_unique" ON "creators" USING btree ("project_id","platform","platform_id");--> statement-breakpoint
CREATE INDEX "lead_searches_project_idx" ON "lead_searches" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_unique" ON "leads" USING btree ("project_id","place_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mentions_unique" ON "mentions" USING btree ("monitor_id","url");--> statement-breakpoint
CREATE INDEX "mentions_project_idx" ON "mentions" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "monitor_runs_monitor_idx" ON "monitor_runs" USING btree ("monitor_id","created_at");--> statement-breakpoint
CREATE INDEX "monitors_project_idx" ON "monitors" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "monitors_due_idx" ON "monitors" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "projects_user_idx" ON "projects" USING btree ("user_id");