from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Default pagination; clients may ask for up to 100 items per page."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
