create extension if not exists pgcrypto;
create table if not exists public.minix_users(
 id bigint generated always as identity primary key,
 username text unique not null,
 password_hash text not null,
 full_name text not null,
 role text not null check(role in ('Admin','Management','PM','Researcher','Trader')),
 pm_name text, researcher_name text, trader_name text,
 allowed_device_id text, active boolean not null default true,
 expiry_date date default '2099-12-31', created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.minix_users enable row level security;
revoke all on public.minix_users from anon, authenticated;

create or replace function public.minix_login(p_username text,p_password_hash text,p_device_id text)
returns table(ok boolean,message text,username text,full_name text,role text,pm_name text,researcher_name text,trader_name text)
language plpgsql security definer set search_path=public as $$
declare u public.minix_users%rowtype;
begin
 select * into u from public.minix_users where lower(minix_users.username)=lower(p_username) limit 1;
 if not found or u.password_hash<>p_password_hash then return query select false,'Invalid username or password.',null::text,null::text,null::text,null::text,null::text,null::text; return; end if;
 if not u.active then return query select false,'User is inactive.',null::text,null::text,null::text,null::text,null::text,null::text; return; end if;
 if current_date>u.expiry_date then return query select false,'Login expired.',null::text,null::text,null::text,null::text,null::text,null::text; return; end if;
 if u.allowed_device_id is null then update public.minix_users set allowed_device_id=p_device_id,updated_at=now() where id=u.id;
 elsif u.allowed_device_id<>p_device_id then return query select false,'Unauthorized device. Contact Admin to reset device.',null::text,null::text,null::text,null::text,null::text,null::text; return; end if;
 return query select true,'OK',u.username,u.full_name,u.role,u.pm_name,u.researcher_name,u.trader_name;
end$$;
grant execute on function public.minix_login(text,text,text) to anon,authenticated;

-- SHA-256 passwords below: Admin@123 and Minix@123
insert into public.minix_users(username,password_hash,full_name,role)
values ('admin',encode(digest('Admin@123','sha256'),'hex'),'Minix Admin','Admin')
on conflict(username) do nothing;

-- Add users from your team. Default password for all is Minix@123; change later.
insert into public.minix_users(username,password_hash,full_name,role,pm_name,researcher_name,trader_name)
values
('pratham.gohel',encode(digest('Minix@123','sha256'),'hex'),'Pratham Gohel','Trader','Chandrasekhar Chatterjee','Tanmay Goyal','Pratham Gohel'),
('alay.patel',encode(digest('Minix@123','sha256'),'hex'),'Alay Patel','Trader','Manoj Pandey','Alay Patel','Alay Patel'),
('jaymin.desai',encode(digest('Minix@123','sha256'),'hex'),'Jaymin Desai','PM','Jaymin Desai',null,null),
('manoj.pandey',encode(digest('Minix@123','sha256'),'hex'),'Manoj Pandey','PM','Manoj Pandey',null,null),
('tanmay.goyal',encode(digest('Minix@123','sha256'),'hex'),'Tanmay Goyal','Researcher','Chandrasekhar Chatterjee','Tanmay Goyal',null)
on conflict(username) do nothing;


-- Device reset helper: run as project owner in SQL Editor.
-- Example: select public.minix_reset_device('jaymin.desai');
create or replace function public.minix_reset_device(p_username text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 update public.minix_users set allowed_device_id=null,updated_at=now() where lower(username)=lower(p_username);
 return found;
end$$;
revoke all on function public.minix_reset_device(text) from public,anon,authenticated;

-- Ensure current core users are active and correctly mapped.
update public.minix_users set full_name='Minix Admin',role='Admin',active=true,expiry_date='2099-12-31' where username='admin';
update public.minix_users set full_name='Jaymin Desai',role='PM',pm_name='Jaymin Desai',researcher_name=null,trader_name=null,active=true,expiry_date='2099-12-31' where username='jaymin.desai';
update public.minix_users set full_name='Manoj Pandey',role='PM',pm_name='Manoj Pandey',researcher_name=null,trader_name=null,active=true,expiry_date='2099-12-31' where username='manoj.pandey';
