export function selectCatalog(data, { brandId = 'all', categoryId = 'all', productId = 'all', query = '' } = {}) {
  const catalog = data.catalog;
  const needle = query.trim().toLocaleLowerCase('de-DE');
  const models = catalog.models.filter(m => {
    const listings = data.listings.filter(l => l.product_id === m.id);
    const skus = data.marketplace_skus.filter(s => listings.some(l => l.id === s.listing_id));
    const terms = [m.name, catalog.brands.find(b => b.id === m.brand_id).name,
      catalog.categories.find(c => c.id === m.category_id).name,
      ...catalog.variants.filter(v => v.model_id === m.id).map(v => v.color),
      ...listings.map(l => l.external_id), ...skus.map(s => s.sku)];
    return (brandId === 'all' || m.brand_id === brandId) && (categoryId === 'all' || m.category_id === categoryId)
      && (productId === 'all' || m.id === productId) && terms.join(' ').toLocaleLowerCase('de-DE').includes(needle);
  });
  const groups = catalog.assortment_groups.filter(g => productId === 'all'
    && (brandId === 'all' || g.brand_id === brandId) && (categoryId === 'all' || g.category_id === categoryId)
    && [catalog.brands.find(b => b.id === g.brand_id).name, catalog.categories.find(c => c.id === g.category_id).name].join(' ').toLocaleLowerCase('de-DE').includes(needle));
  return { models, groups };
}
