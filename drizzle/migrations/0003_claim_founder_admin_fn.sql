create or replace function public.claim_founder_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role)
    values (auth.uid(), 'admin')
    on conflict (user_id, role) do nothing;
    return true;
  end if;
  return exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
end;
$$;

grant execute on function public.claim_founder_admin() to authenticated;